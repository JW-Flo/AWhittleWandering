# Context

## AWhittleWandering

A personal Tesla road trip tracker for a 48-state continental US journey.

## Platform

- **Frontend**: React + TypeScript + Vite → Cloudflare Pages
- **Backend**: Cloudflare Workers (Hono) + D1 database
- **Integration**: Tessie Tesla API

## Guardrails

- Strict CSP/HSTS/XFO headers
- `/healthz` endpoint returns 200
- No secrets in repo (use Wrangler secrets + GitHub Actions secrets)
