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

describe('OpenAPI drift', () => {
  it('OpenAPI contains all implemented routes (GET/POST/PUT/DELETE/PATCH)', () => {
    const routes: RouteLike[] = (app as any)?.routes || (app as any)?.router?.routes || [];
    expect(Array.isArray(routes)).toBe(true);
    expect(routes.length).toBeGreaterThan(0);

    const openapiPaths = (openapi as any).paths || {};

    const relevantMethods = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

    const missing: string[] = [];
    for (const r of routes) {
      const method = String((r as any).method || '').toUpperCase();
      const rawPath = String((r as any).path || '');

      if (!relevantMethods.has(method)) continue;
      if (!rawPath || rawPath === '*' || rawPath.includes('*')) continue; // ignore middleware/wildcards

      const path = normalizePath(toOpenApiPath(rawPath));
      const op = openapiPaths[path]?.[method.toLowerCase()];
      if (!op) missing.push(`${method} ${path}`);
    }

    expect(missing, `Missing operations in openapi.json:\n- ${missing.join('\n- ')}`).toEqual([]);
  });
});


