# Cloudflare Pages Redirect Configuration

## Current Configuration

File: `frontend/public/_redirects`

```
/* /index.html 200
```

This is the standard Cloudflare Pages SPA fallback rule. It tells Pages to serve `index.html` for any path that doesn't match a static file, with a 200 status (not a redirect).

## Why This Works

Cloudflare Pages processes `_redirects` rules **after** checking for static files. The `/* /index.html 200` rule:

1. Does **not** match requests for files that physically exist in the build output (e.g., `/assets/main-abc123.js`)
2. Only fires for paths that would otherwise 404 (e.g., `/journey/live`, `/dashboard`)
3. Returns the content of `index.html` with a 200 status, allowing React Router to handle client-side routing

## Previous Issues

An infinite redirect loop was observed. Root causes investigated:

1. **Conflicting `_headers` rules** — The `_headers` file contained `/api/*` rules for CORS headers. Since the frontend does **not** serve API routes (the API is at `api.awhittlewandering.com`), these rules were unnecessary and potentially confusing. They have been removed.

2. **Pages + Worker route collision** — If a Worker route pattern overlaps with Pages, it can cause loops. The current architecture uses separate domains:
   - Pages: `awhittlewandering.com` (frontend)
   - Worker: `api.awhittlewandering.com` (backend)

   This separation eliminates route collision.

## Rules for Modifying `_redirects`

1. Keep the SPA fallback as the **last** rule (it's a catch-all)
2. Never add rules that redirect to external URLs without the `301` or `302` status
3. Never add `/api/*` proxy rules — the API is on a separate subdomain
4. Test locally with `npx wrangler pages dev dist` before pushing
