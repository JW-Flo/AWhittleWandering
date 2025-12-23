import { describe, it, expect } from 'vitest';
import app from '../src/index';
import openapi from '../openapi.json';

type RouteLike = { method?: string; path?: string } | any;

function toOpenApiPath(honoPath: string): string {
  // Hono uses :param while OpenAPI uses {param}
  return honoPath.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function normalizePath(p: string): string {
  // Hono sometimes includes trailing slashes; OpenAPI typically does not
  if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1);
  return p;
}

function key(method: string, path: string) {
  return `${method.toUpperCase()} ${normalizePath(path)}`;
}

describe('OpenAPI drift', () => {
  it('OpenAPI and implemented routes match (GET/POST/PUT/DELETE/PATCH)', () => {
    const routes: RouteLike[] = (app as any)?.routes || (app as any)?.router?.routes || [];
    expect(Array.isArray(routes)).toBe(true);
    expect(routes.length).toBeGreaterThan(0);

    const openapiPaths = (openapi as any).paths || {};

    const relevantMethods = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

    // --- implemented -> openapi
    const implemented = new Set<string>();
    const missingInOpenApi: string[] = [];
    for (const r of routes) {
      const method = String((r as any).method || '').toUpperCase();
      const rawPath = String((r as any).path || '');

      if (!relevantMethods.has(method)) continue;
      if (!rawPath || rawPath === '*' || rawPath.includes('*')) continue; // ignore middleware/wildcards

      const path = normalizePath(toOpenApiPath(rawPath));
      implemented.add(key(method, path));

      const op = openapiPaths[path]?.[method.toLowerCase()];
      if (!op) missingInOpenApi.push(key(method, path));
    }
    expect(
      missingInOpenApi,
      `Missing operations in openapi.json:\n- ${missingInOpenApi.join('\n- ')}`
    ).toEqual([]);

    // --- openapi -> implemented
    const missingInCode: string[] = [];
    for (const [p, ops] of Object.entries(openapiPaths)) {
      for (const [m, _op] of Object.entries((ops as any) || {})) {
        const method = String(m).toUpperCase();
        if (!relevantMethods.has(method)) continue;
        const k = key(method, String(p));
        if (!implemented.has(k)) missingInCode.push(k);
      }
    }

    expect(
      missingInCode,
      `Operations exist in openapi.json but are not implemented in the worker:\n- ${missingInCode.join('\n- ')}`
    ).toEqual([]);
  });
});


