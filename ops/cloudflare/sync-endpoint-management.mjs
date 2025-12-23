/**
 * Sync Cloudflare API Shield Endpoint Management from an OpenAPI v3 spec.
 *
 * Why:
 * Cloudflare Schema Validation only enforces on endpoints present in Endpoint Management.
 *
 * Env:
 *   CF_API_TOKEN   Cloudflare API token (Zone read + API Shield edit)
 *   CF_ZONE_ID     Zone ID (awhittlewandering.com)
 *
 * Optional:
 *   SPEC_FILE      Path to OpenAPI JSON (default: backend/edge-worker/openapi.json)
 *   HOSTNAME       Override hostname; otherwise derived from spec.servers[0].url
 *
 * Notes:
 * - This uses Cloudflare's API Gateway/Endpoint Management API. If Cloudflare changes the path,
 *   this script prints the endpoints it intended to create so you can add them manually in the dashboard.
 */

import { readFile } from 'node:fs/promises';

const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_ZONE_ID = process.env.CF_ZONE_ID;
const SPEC_FILE = process.env.SPEC_FILE || 'backend/edge-worker/openapi.json';

if (!CF_API_TOKEN) throw new Error('Missing CF_API_TOKEN');
if (!CF_ZONE_ID) throw new Error('Missing CF_ZONE_ID');

const specRaw = await readFile(SPEC_FILE, 'utf8');
const spec = JSON.parse(specRaw);

function hostnameFromServers() {
  const url = spec?.servers?.[0]?.url;
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

const HOSTNAME = process.env.HOSTNAME || hostnameFromServers();
if (!HOSTNAME) throw new Error('Missing HOSTNAME and could not infer from spec.servers[0].url');

const allowedMethods = new Set(['get', 'post', 'put', 'delete', 'patch']);
const desired = [];

for (const [path, ops] of Object.entries(spec.paths || {})) {
  for (const [method, op] of Object.entries(ops || {})) {
    if (!allowedMethods.has(method)) continue;
    // Filter out legacy redirects/non-API noise if needed; currently we keep everything in the spec.
    desired.push({ method: method.toUpperCase(), path, host: HOSTNAME, summary: op?.summary || '' });
  }
}

desired.sort((a, b) => (a.host + a.path + a.method).localeCompare(b.host + b.path + b.method));

const base = 'https://api.cloudflare.com/client/v4';

async function cfFetch(path, init) {
  const res = await fetch(base + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok || json?.success === false) {
    const err = new Error(`Cloudflare API error ${res.status} for ${path}`);
    err.details = json;
    throw err;
  }
  return json;
}

// Endpoint Management APIs have historically lived under "api_gateway".
// We'll try a primary path; if it fails, we fall back to manual instructions.
const endpointsCollectionPath = `/zones/${CF_ZONE_ID}/api_gateway/endpoints`;

let created = 0;
const failed = [];

for (const ep of desired) {
  try {
    await cfFetch(endpointsCollectionPath, {
      method: 'POST',
      body: JSON.stringify({
        method: ep.method,
        host: ep.host,
        path: ep.path
      })
    });
    created += 1;
  } catch (e) {
    // Common case: already exists or API path not enabled for account plan.
    failed.push({ ...ep, error: e?.message, details: e?.details });
  }
}

console.log(JSON.stringify({ ok: true, hostname: HOSTNAME, desired: desired.length, created, failedCount: failed.length }, null, 2));

if (failed.length) {
  console.log('\nSome endpoints were not created automatically. Add these in Cloudflare Dashboard:');
  console.log('Security → API Shield → Endpoint Management → Add endpoints → Manually add\n');
  for (const ep of failed) {
    console.log(`${ep.method} ${ep.host}${ep.path}`);
  }
  console.log('\nTip: failures are often "already exists". If you want full idempotency, extend this script to list+diff existing endpoints.');
}


