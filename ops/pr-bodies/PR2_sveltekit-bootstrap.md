# PR2: SvelteKit Bootstrap (Workers)

## Summary

Introduce a minimal SvelteKit app configured for Cloudflare Workers with strict security headers and health endpoint.

## Changes

- Add apps/sveltekit skeleton
- Strict CSP/HSTS/XFO in hooks.server.ts
- /health route
- CI workflow (pnpm) and node: import guard

## How to validate

- pnpm install && pnpm run build in apps/sveltekit
- pnpm run test (if present)
- `curl http://localhost:5173/health` during dev returns 200

## Acceptance criteria

- [ ] Build succeeds without Node polyfills
- [ ] /health returns 200 locally
- [ ] CI job passes including node: import guard

## Rollback plan

- Revert commit and remove apps/sveltekit
