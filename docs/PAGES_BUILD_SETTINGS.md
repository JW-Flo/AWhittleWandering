# Cloudflare Pages Build Settings

## Source of Truth

These are the exact settings for the Cloudflare Pages project `awhittlewandering`.

| Setting             | Value                          |
| ------------------- | ------------------------------ |
| Framework preset    | None                           |
| Root directory      | `frontend`                     |
| Build command       | `npm ci && npm run build`      |
| Build output dir    | `dist`                         |
| Node.js version     | 20                             |

## Environment Variables (Pages Dashboard)

| Variable              | Production Value                          | Preview Value                                      |
| --------------------- | ----------------------------------------- | -------------------------------------------------- |
| `VITE_API_BASE_URL`   | `https://api.awhittlewandering.com`       | `https://api-staging.awhittlewandering.com`        |
| `NODE_VERSION`        | `20`                                      | `20`                                               |

## Notes

- The frontend workspace is part of a monorepo. Pages "Root directory" must be set to `frontend` so that Pages runs the build command from within `frontend/`.
- `package-lock.json` exists at the repo root (monorepo level). The frontend workspace relies on hoisted dependencies via npm workspaces. The build command uses `npm ci` which reads `package-lock.json` from the nearest ancestor.
- Build output is `dist` (Vite default, confirmed in `vite.config.ts`).
- Framework preset "None" is correct — Vite is used directly, not via a meta-framework.

## Verification

After changing Pages settings in the dashboard:

```bash
# Trigger a Pages build and check logs for:
# 1. "Build command: npm ci && npm run build"
# 2. "Build output directory: /dist"
# 3. No "invalid redirect" warnings
# 4. Exit code 0
```
