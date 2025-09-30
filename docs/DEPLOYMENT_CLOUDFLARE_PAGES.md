# Cloudflare Pages Deployment

## Bindings

- KV/D1/R2 as needed; configure per-environment in Pages project settings.

## Environments

- Production
- Preview (per PR)

## Secrets

- Configure via Pages project → Settings → Environment variables.

## Build command

- In app directory (e.g., apps/sveltekit):
  - Install: pnpm install
  - Build: pnpm run build

## Adapter-cloudflare

- Ensure `@sveltejs/adapter-cloudflare` is configured in `svelte.config.js`.
- No Node polyfills permitted (guard step blocks `node:` imports).

## Health smoke test

- Verify `GET /health` returns 200.
