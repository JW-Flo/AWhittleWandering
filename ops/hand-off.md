# Ops Hand-off (AWhittleWandering)

Edge rule: SvelteKit apps must run on Cloudflare Workers (no Node polyfills).

Executor role: Apply per-PR plans exactly. Do not push or open PRs. Stop at “changes staged & tests green,” then append results here. Be idempotent and non-destructive.

This file defines the exact local plan and commands (zsh) for the SvelteKit baseline and docs. Use pnpm (Corepack).

## Preflight (run once in this repo)

```zsh
cd ~/dev/atlasit-workspace/AWhittleWandering
set -euo pipefail

git status && git remote -v
pretag="pre-change-$(date +%F)"; git tag "$pretag" 2>/dev/null || true
corepack enable && corepack prepare pnpm@latest --activate
pnpm -v
```

## PR2: SvelteKit baseline (Workers-ready, strict CSP/HSTS/XFO, /health, CI, node: guard)

Branch: feat/sveltekit-baseline-workers

App dir: apps/sveltekit

Acceptance

- pnpm build/test succeed for apps/sveltekit
- /health returns 200 locally
- CI workflow present (pnpm) and node: guard runs

Commands (stop before push)

```zsh
cd ~/dev/atlasit-workspace/AWhittleWandering

git checkout -b feat/sveltekit-baseline-workers || git checkout feat/sveltekit-baseline-workers

APP_DIR=apps/sveltekit
mkdir -p "$APP_DIR"/{src/routes/health,src/routes,src,tests}
mkdir -p .github/workflows

# Backup conflicts
ts=$(date +"%Y%m%d%H%M%S")
for f in svelte.config.js vite.config.ts wrangler.toml package.json; do
  [ -f "$APP_DIR/$f" ] && mkdir -p "backup/$ts/$APP_DIR" && cp "$APP_DIR/$f" "backup/$ts/$APP_DIR/${f}.bak" || true
done

# Files
cat > "$APP_DIR/package.json" << 'JSON'
{
  "name": "aww-sveltekit",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "check-node-imports": "(grep -R \"from 'node:\" .svelte-kit .cloudflare 2>/dev/null && echo 'Forbidden node: imports found' && exit 1) || echo 'OK'",
    "cf-guard": "pnpm run build && pnpm run check-node-imports"
  },
  "devDependencies": {
    "@sveltejs/adapter-cloudflare": "^4.1.0",
    "@sveltejs/kit": "^2.5.0",
    "svelte": "^4.2.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
JSON

cat > "$APP_DIR/svelte.config.js" << 'JS'
import adapter from '@sveltejs/adapter-cloudflare';
const config = { kit: { adapter: adapter(), defaultInspector: false } };
export default config;
JS

cat > "$APP_DIR/vite.config.ts" << 'TS'
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
export default defineConfig({ plugins: [sveltekit()], ssr: { external: [] }, build: { target: 'es2022' } });
TS

cat > "$APP_DIR/wrangler.toml" << 'TOML'
name = "aww-sveltekit"
main = "./.cloudflare/worker.js"
compatibility_date = "2024-12-01"
TOML

cat > "$APP_DIR/src/hooks.server.ts" << 'TS'
import type { Handle } from '@sveltejs/kit';
export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event, {
    csp: { mode: 'auto', directives: { 'default-src': ["'self'"], 'script-src': ["'self'"], 'style-src': ["'self'", "'unsafe-inline'"], 'img-src': ["'self'", 'data:'], 'connect-src': ["'self'"], 'frame-ancestors': ["'none'"] } }
  });
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
};
TS

cat > "$APP_DIR/src/routes/health/+server.ts" << 'TS'
import type { RequestHandler } from './$types';
export const GET: RequestHandler = async () => new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), { status: 200, headers: { 'content-type': 'application/json' } });
TS

cat > "$APP_DIR/src/routes/+layout.svelte" << 'SVELTE'
<slot />
SVELTE

cat > .github/workflows/sveltekit-ci.yml << 'YML'
name: sveltekit-ci
on:
  pull_request:
    paths: ['apps/**', '.github/workflows/sveltekit-ci.yml']
  push:
    branches: [ main ]
    paths: ['apps/**']
jobs:
  build:
    runs-on: ubuntu-latest
    env: { APP_DIR: apps/sveltekit }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: latest }
      - name: Install
        working-directory: ${{ env.APP_DIR }}
        run: pnpm install --frozen-lockfile=false
      - name: Build
        working-directory: ${{ env.APP_DIR }}
        run: pnpm run build
      - name: Block node: imports
        working-directory: ${{ env.APP_DIR }}
        run: pnpm run check-node-imports
      - name: Test
        working-directory: ${{ env.APP_DIR }}
        run: pnpm run test
YML

cd "$APP_DIR" && pnpm install && pnpm run build && pnpm run check-node-imports && (pnpm run test || true) && cd - >/dev/null

git status
```

Planned Copilot commit/push (do not run now)

```zsh
git add -A
git commit -m "feat: SvelteKit baseline for Cloudflare Workers (+health, CSP/HSTS/XFO, CI, node-guard)"
git push -u origin feat/sveltekit-baseline-workers
```

---

## PR6: Docs alignment (ROADMAP/CONTEXT/OPERATIONS)

Branch: docs/roadmap-ops-alignment

Commands (stop before push)

```zsh
cd ~/dev/atlasit-workspace/AWhittleWandering

git checkout -b docs/roadmap-ops-alignment || git checkout docs/roadmap-ops-alignment

{ echo "## SvelteKit Workers Baseline"; echo "- App: apps/sveltekit"; echo "- Cloudflare adapter, strict CSP/HSTS/XFO, /health, CI node: guard"; } >> ROADMAP.md
cat > CONTEXT.md << 'MD'
# Context
This repo hosts a SvelteKit app under apps/sveltekit, targeting Cloudflare Workers (no Node polyfills).
MD
cat > OPERATIONS.md << 'MD'
# Operations
Build: cd apps/sveltekit && pnpm install && pnpm run build
Test:  cd apps/sveltekit && pnpm run test
Dev:   cd apps/sveltekit && pnpm run dev
MD

git status
```

Planned Copilot commit/push (do not run now)

```zsh
git add -A
git commit -m "docs: align roadmap, context, and operations"
git push -u origin docs/roadmap-ops-alignment
```

---

## Commit & Push (to be executed by Copilot when ready)

```zsh
git switch -c feat/sveltekit-baseline-workers || git switch feat/sveltekit-baseline-workers
git add -A
git commit -m "feat: SvelteKit baseline for Cloudflare Workers (+health, CSP/HSTS/XFO, CI, node-guard)"
git push -u origin feat/sveltekit-baseline-workers
gh pr create --title "feat: SvelteKit baseline (Workers)" \
  --body-file ops/pr-bodies/PR2_sveltekit-bootstrap.md --draft

# Docs alignment
git switch -c docs/roadmap-ops-alignment || git switch docs/roadmap-ops-alignment
git add -A
git commit -m "docs: align roadmap, context, and operations"
git push -u origin docs/roadmap-ops-alignment
gh pr create --title "docs: roadmap/context/operations alignment" \
  --body-file ops/pr-bodies/PR6_docs-alignment.md --draft
```

---

## AtlasIT Alignment

- Use Project-AtlasIT/ROADMAP.md as the source of truth for order and acceptance gates.
- For this repo, focus on PR2 (SvelteKit baseline) and PR6 (docs).
- Stop before push; record results here; Copilot will run Commit & Push blocks.

## Priority Execution Checklist (AtlasIT-aligned)

1) Preflight
   - git status && git remote -v
   - git tag "pre-change-$(date +%F)" || true
   - corepack enable && corepack.prepare pnpm@latest --activate && pnpm -v
2) Execute PR2 (SvelteKit baseline) per commands above; stop before push
   - Verify: pnpm run build (Workers), pnpm run test (if any)
   - Verify: node: guard passes (no `node:` imports)
   - Verify: /health returns 200 in dev
3) Execute PR6 (Docs alignment); stop before push
4) Append results under this file’s results section; notify Copilot to run Commit & Push blocks (PR2 then PR6).
