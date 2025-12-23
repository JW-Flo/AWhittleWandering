import { readFileSync, writeFileSync } from 'node:fs';

// Generate a machine-readable drift report for remediation tooling.
// This runs in CI after `npm run build` so we can import the compiled worker app.

const openapi = JSON.parse(readFileSync(new URL('../openapi.json', import.meta.url), 'utf8'));
const mod = await import(new URL('../dist/index.js', import.meta.url));
const app = mod?.default;

if (!app) {
  console.error('openapi-drift-report: failed to import app from dist/index.js');
  process.exit(2);
}

const routes = app?.routes || app?.router?.routes || [];
const openapiPaths = openapi?.paths || {};
const relevantMethods = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

function toOpenApiPath(honoPath) {
  return String(honoPath).replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}
function normalizePath(p) {
  const s = String(p);
  if (s.length > 1 && s.endsWith('/')) return s.slice(0, -1);
  return s;
}
function key(method, path) {
  return `${String(method).toUpperCase()} ${normalizePath(path)}`;
}

const implemented = new Set();
const missingInOpenApi = [];

for (const r of routes) {
  const method = String(r?.method || '').toUpperCase();
  const rawPath = String(r?.path || '');
  if (!relevantMethods.has(method)) continue;
  if (!rawPath || rawPath === '*' || rawPath.includes('*')) continue;

  const path = normalizePath(toOpenApiPath(rawPath));
  implemented.add(key(method, path));
  const op = openapiPaths[path]?.[method.toLowerCase()];
  if (!op) missingInOpenApi.push(key(method, path));
}

const missingInCode = [];
for (const [p, ops] of Object.entries(openapiPaths)) {
  for (const [m, _op] of Object.entries(ops || {})) {
    const method = String(m).toUpperCase();
    if (!relevantMethods.has(method)) continue;
    const k = key(method, String(p));
    if (!implemented.has(k)) missingInCode.push(k);
  }
}

missingInOpenApi.sort();
missingInCode.sort();

const report = {
  ok: missingInOpenApi.length === 0 && missingInCode.length === 0,
  generatedAt: new Date().toISOString(),
  openapiFile: 'backend/edge-worker/openapi.json',
  missingInOpenApi,
  missingInCode,
  remediation: {
    action: 'Update openapi.json and/or implementation to match',
    hints: [
      'If missingInOpenApi is non-empty: add those operations to openapi.json (so Cloudflare can validate them).',
      'If missingInCode is non-empty: remove stale operations from openapi.json or implement them.',
      'After fixing, re-run CI to sync schema + Endpoint Management to Cloudflare.'
    ]
  }
};

const outPath = new URL('../openapi-drift-report.json', import.meta.url);
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ok: true, wrote: 'backend/edge-worker/openapi-drift-report.json', reportSummary: { ok: report.ok, missingInOpenApi: missingInOpenApi.length, missingInCode: missingInCode.length } }, null, 2));




