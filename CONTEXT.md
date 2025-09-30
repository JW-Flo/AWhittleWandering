# Context

## AtlasIT Alignment

- Defer to Project-AtlasIT/ROADMAP.md for the prioritized sequence and acceptance criteria.
- Target platform: Cloudflare Workers. Guardrails:
  - @sveltejs/adapter-cloudflare
  - Strict CSP/HSTS/XFO in hooks.server.ts
  - /health endpoint returns 200
  - No `node:` imports in bundles (guard step)
