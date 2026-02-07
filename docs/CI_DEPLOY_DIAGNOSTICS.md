# CI Deploy Diagnostics

How deploy failures are captured, surfaced, and resolved in AWhittleWandering CI.

## Where logs are stored

| Artifact | Workflow | Retention |
|---|---|---|
| `backend-deploy-logs-{run}` | Deploy Backend | 14 days |
| `frontend-deploy-logs-{run}` | Deploy Frontend | 14 days |
| `playwright-report-{run}` | E2E Smoke | 14 days |
| `playwright-traces-{run}` | E2E Smoke (failures only) | 14 days |

Download from **Actions → Run → Artifacts** in the GitHub UI.

## GitHub Annotations

On deploy failure the workflows parse wrangler output for known error
patterns and emit `::error` / `::warning` annotations:

| Pattern | Annotation |
|---|---|
| `10021` | `_redirects` infinite loop — use Worker SPA fallback |
| `authentication` | `CLOUDFLARE_API_TOKEN` issue |
| `missing binding` | Wrangler binding misconfiguration |
| `rate limit` | Cloudflare rate-limiting; retry later |
| `name mismatch` | Worker name differs from CI expectation |

## Error 10021 — `_redirects` infinite redirect loop

### What it means

Cloudflare validates `_redirects` rules at deploy time. The rule
`/* /index.html 200` triggers error 10021 because `/index.html` itself
matches the wildcard `/*`, creating a theoretical infinite loop.

### How we fixed it

Instead of `_redirects`, SPA fallback is implemented in code:

1. **`src/spa-worker.ts`** — A lightweight Worker that:
   - Tries to serve the requested static asset via `env.ASSETS.fetch()`.
   - If the asset 404s and the request accepts `text/html`, rewrites to
     `/index.html`.
   - Leaves `/api/*` routes untouched.

2. **Root `wrangler.toml`** — Configures `[assets]` with
   `not_found_handling = "none"` and `binding = "ASSETS"` so the Worker
   receives 404s instead of Cloudflare's default handler.

3. **Build cleanup** — CI removes any `_redirects` from `frontend/dist/`
   after the Vite build (belt-and-suspenders).

### What changed

- Deleted `frontend/public/_redirects`.
- Created `src/spa-worker.ts`.
- Updated root `wrangler.toml` (`main`, `[assets]` binding).
- Both deploy workflows now remove `_redirects` from build output.

## Reproducing locally

```bash
# Build the frontend
cd frontend && npm run build

# Verify no _redirects in output
ls -la dist/_redirects  # should not exist

# Test the Worker locally with wrangler
cd .. && npx wrangler dev

# Visit http://localhost:8787/dashboard — should serve index.html
# Visit http://localhost:8787/nonexistent.js — should 404
```

## Playwright E2E Smoke Tests

Smoke tests verify key UI paths render without crashing:

- `/dashboard` — loads, heading visible
- `/dashboard` Author tab — click tab, content not blank, no console errors
- `/coordination` — stable render
- `/demo` — heading + button visible

### Running locally

```bash
cd frontend
npx playwright install --with-deps chromium
npm run build
npm run test:e2e
```

### Against a deployed preview

```bash
cd frontend
npx playwright install --with-deps chromium
E2E_BASE_URL=https://pr-42.awhittlewandering.pages.dev npm run test:e2e
```

On failure, screenshots and traces are saved to `frontend/test-results/`.
