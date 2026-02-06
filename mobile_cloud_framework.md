# Mobile-First Cloud Development Framework v2
*Agent-Executable Playbook for Claude Code + Gastown Orchestration on Android*

## Overview

This framework enables **full-stack cloud application development** from Android devices using AI coding agents orchestrated by **Gastown**. Mobile is the **triggering surface** — all execution runs on remote machines via SSH/tmux. Gastown provides multi-agent coordination, crash recovery, and persistent work state through git-backed hooks.

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│  MOBILE (Android)                                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ SSH + tmux   │  │ GitHub Mobile │  │ OpenClaw /     │  │
│  │ (Termux)     │  │ (Issue/PR)   │  │ WhatsApp       │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
└─────────┼─────────────────┼──────────────────┼───────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌──────────────────────────────────────────────────────────┐
│  REMOTE MACHINE (VPS / Home Server / Codespace)          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  GASTOWN (gt)                                     │    │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────────┐   │    │
│  │  │ Mayor   │──│ Convoys  │──│ Beads Ledger   │   │    │
│  │  │ (coord) │  │ (bundles)│  │ (git-backed)   │   │    │
│  │  └────┬────┘  └──────────┘  └────────────────┘   │    │
│  │       │                                           │    │
│  │  ┌────▼────┐  ┌──────────┐  ┌────────────────┐   │    │
│  │  │Polecats │──│ Hooks    │──│ Git Worktrees  │   │    │
│  │  │(workers)│  │(persist) │  │ (isolation)    │   │    │
│  │  └─────────┘  └──────────┘  └────────────────┘   │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────┐  ┌─────────────────────────┐   │
│  │ Claude Code CLI      │  │ MCP Servers             │   │
│  │ (execution engine)   │  │ ├ cloudflare-bindings   │   │
│  │ ├ Read/Write/Edit    │  │ ├ cloudflare-builds     │   │
│  │ ├ Bash/Git           │  │ ├ cloudflare-observ.    │   │
│  │ └ Task (subagents)   │  │ └ github                │   │
│  └──────────────────────┘  └─────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────┐
│  CI/CD (GitHub Actions)                                  │
│  push → lint → test → deploy:staging → smoke → approve   │
│  → backup D1 → migrate prod → deploy:prod → verify       │
└──────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────┐
│  CLOUDFLARE EDGE                                         │
│  Workers (Hono v4) │ D1 (SQLite) │ KV │ R2 │ DNS/CDN   │
└──────────────────────────────────────────────────────────┘
```

## Cognitive Guidance Layer (Copilot Custom Agents)

Purpose: improve PR review quality and indirectly drive CI/CD hardening through advisory-only guidance.

### Capabilities
- Provide high-signal PR review feedback on security, CI safety, release readiness, and incident preparedness.
- Identify CI/CD risks, gaps, or misconfigurations based on diffs and provided artifacts.
- Recommend targeted, minimal changes that improve determinism and auditability.

### Explicit Non-Capabilities
- Do not execute code, run tests, or trigger workflows.
- Do not enforce policy, gate merges, or act as an approval mechanism.
- Do not modify CI/CD orchestration, runtime behavior, or architecture boundaries.

### Architecture Diagram
```
Human / PR
      ↓
Copilot Custom Agents (Guidance Only)
      ↓
GitHub Actions / Bots (Execution & Enforcement)
      ↓
External Agents / Orchestrators
```

### Design Principle
Copilot agents are stateless, advisory, and never the source of truth.

### Why Gastown

| Problem                            | Without Gastown           | With Gastown                          |
|------------------------------------|---------------------------|---------------------------------------|
| Context window fills up            | Agent stops, work lost    | GUPP: work persists on hooks, next agent picks up |
| Agent session crashes              | Start over manually       | Git-backed hooks survive restarts     |
| Complex features need parallelism  | One agent, sequential     | Mayor spawns Polecats, parallel execution |
| Mobile screen too small to debug   | Frustration               | Mayor summarizes progress, you review PRs |
| Repeatable deployment steps        | Copy-paste commands       | Beads Formulas encode full pipelines  |

---

## Stack

| Layer        | Technology                                                |
|--------------|-----------------------------------------------------------|
| Runtime      | Cloudflare Workers                                        |
| Framework    | Hono v4 + `@hono/zod-validator`                           |
| Validation   | Zod                                                       |
| Database     | Cloudflare D1 (SQLite)                                    |
| Cache        | Cloudflare KV                                             |
| Storage      | Cloudflare R2                                             |
| Language     | TypeScript (strict mode)                                  |
| CLI          | Wrangler v4                                               |
| Orchestrator | Gastown `gt` + Beads `bd`                                 |
| Agent        | Claude Code CLI (`@anthropic-ai/claude-code`)             |
| CI/CD        | GitHub Actions + `cloudflare/wrangler-action@v3`          |
| MCP          | Cloudflare Bindings, Builds, Observability, GitHub        |

---

## Phase 0: Remote Machine Setup (One-Time)

> Mobile is a triggering surface. All execution happens here.

### Prerequisites

```bash
# On your VPS / home server / Codespace
node --version    # >= 20.x
go version        # >= 1.23
git --version     # >= 2.25 (worktree support)
tmux -V           # >= 3.0

# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Install Gastown
go install github.com/steveyegge/gastown/cmd/gt@latest
export PATH="$PATH:$HOME/go/bin"

# Install Beads
go install github.com/steveyegge/beads/cmd/bd@latest

# Install Wrangler v4
npm install -g wrangler

# Authenticate Cloudflare (interactive, one-time)
wrangler login

# Store API token for CI/CD (non-interactive) use
# Create scoped token at https://dash.cloudflare.com/profile/api-tokens
# Permissions: Workers Scripts (Edit), D1 (Edit), KV (Edit), R2 (Edit)
```

### SSH Access from Android

```bash
# On remote machine
sudo apt install openssh-server mosh

# On Android (Termux)
pkg install openssh mosh
ssh-keygen -t ed25519

# Copy key to remote
ssh-copy-id user@your-server

# Connect (mosh handles intermittent mobile connectivity)
mosh user@your-server
tmux attach || tmux new -s dev
```

---

## Phase 1: Gastown Workspace Initialization

```bash
# Initialize Gastown workspace
gt install ~/gt --git
cd ~/gt

# Add your project as a Rig
gt rig add myproject git@github.com:you/your-repo.git

# Create your crew workspace (human workspace)
gt crew add andrey --rig myproject
```

### Configure Agent Runtimes

```bash
# View built-in presets
gt config agent list
# Built-in: claude, gemini, codex, cursor, auggie, amp

# Set default
gt config default-agent claude

# Optional: custom aliases for cost control
gt config agent set claude-sonnet "claude --model sonnet"
gt config agent set claude-opus "claude --model opus"
```

### Configure MCP Servers

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "cloudflare-bindings": {
      "type": "http",
      "url": "https://bindings.mcp.cloudflare.com/mcp"
    },
    "cloudflare-observability": {
      "type": "http",
      "url": "https://observability.mcp.cloudflare.com/mcp"
    },
    "cloudflare-docs": {
      "type": "http",
      "url": "https://docs.mcp.cloudflare.com/mcp"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" }
    }
  }
}
```

Register in Claude Code:

```bash
claude mcp add --transport http cloudflare-bindings https://bindings.mcp.cloudflare.com/mcp
claude mcp add --transport http cloudflare-obs https://observability.mcp.cloudflare.com/mcp
```

---

## Phase 2: Project Scaffold

### Directory Structure

```
your-project/
├── CLAUDE.md                    # Agent instructions (< 300 lines)
├── AGENTS.md -> CLAUDE.md       # Symlink for cross-agent compat
├── .mcp.json                    # MCP server config
├── .beads/
│   └── formulas/                # Gastown deployment formulas
│       ├── deploy-staging.formula.toml
│       ├── deploy-production.formula.toml
│       └── db-migrate.formula.toml
├── .claude/
│   ├── settings.json            # Claude Code permissions
│   └── commands/                # Custom slash commands
│       ├── deploy.md
│       └── test.md
├── .github/
│   └── workflows/
│       ├── ci.yml               # Lint + test on PR
│       ├── deploy-staging.yml   # Auto-deploy staging
│       └── deploy-production.yml # Gated production deploy
├── wrangler.jsonc               # Cloudflare config (v4 format)
├── migrations/                  # D1 SQL migrations (forward-only)
│   ├── 0001_initial.sql
│   └── 0002_add_indexes.sql
├── src/
│   ├── index.ts                 # Hono app entry
│   ├── routes/                  # Route handlers
│   ├── schemas/                 # Zod validation schemas
│   ├── middleware/               # Auth, CORS, rate limiting
│   └── types/
│       └── env.ts               # Cloudflare binding types
├── test/                        # Vitest tests
├── package.json
└── tsconfig.json
```

### CLAUDE.md (Root — Agent Instructions)

> Under 300 lines. Imperative style. Progressive disclosure via @docs/ references.

```markdown
# Project: your-app (Hono + Cloudflare Workers)

## Stack
Hono v4, TypeScript strict, Zod, Cloudflare Workers, D1, KV, R2
Orchestrator: Gastown (gt) + Beads (bd)

## Commands
npm run dev          # wrangler dev --local (port 8787)
npm test             # vitest run
npm run lint         # eslint --fix
npm run typecheck    # tsc --noEmit
npm run deploy:stg   # wrangler deploy --env staging
npm run deploy:prod  # wrangler deploy --env production
npm run db:migrate   # wrangler d1 migrations apply DB --remote

## Architecture
- src/index.ts       — Hono app, middleware chain, route mounting
- src/routes/        — One file per resource (users.ts, items.ts)
- src/schemas/       — Zod schemas, co-located with routes
- src/middleware/     — auth.ts, cors.ts, rateLimit.ts
- src/types/env.ts   — Cloudflare binding type definitions
- migrations/        — Numbered SQL files, forward-only

## Standards
1. All route handlers use zValidator() from @hono/zod-validator
2. NEVER put secrets in wrangler.jsonc — use `wrangler secret put`
3. NEVER commit .env files — .gitignore enforced
4. All DB queries use parameterized bindings (?.bind())
5. Error responses include requestId (crypto.randomUUID())
6. Structured JSON logging on all errors

## Workflow (Gastown-managed)
1. Mayor creates convoy with beads for the feature
2. Polecat agent creates feature branch from main
3. Implement changes with tests in feature branch
4. Run: npm test && npm run lint && npm run typecheck
5. IF tests fail: revert last change, try alternative approach
6. IF tests pass: git commit (Conventional Commits), push
7. Create PR via `gh pr create --fill`
8. CI deploys preview, runs smoke tests
9. Human reviews PR on GitHub Mobile
10. Merge triggers staging → production pipeline

## D1 Migration Rules
- Migrations are FORWARD-ONLY (no down migrations)
- ALWAYS run `wrangler d1 export DB --remote --output backup.sql` before migrating
- ALWAYS test migration on staging before production
- Use D1 Time Travel for emergency recovery (30-day window)

## Error Recovery
- IF deploy fails: `wrangler rollback` (instant revert to previous version)
- IF migration fails mid-execution: D1 auto-rolls back the failed migration
- IF migration succeeds but app breaks: restore from backup.sql
- IF context window fills: work is on your Gastown hook — new session picks up
```

### Binding Types

```typescript
// src/types/env.ts
export type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  STORAGE: R2Bucket;
  JWT_SECRET: string;
  ENVIRONMENT: string;
};

export type AppEnv = { Bindings: Bindings };
```

### Hono App Entry

```typescript
// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import type { AppEnv } from './types/env';
import { itemRoutes } from './routes/items';
import { errorHandler } from './middleware/errors';

const app = new Hono<AppEnv>();

// Global middleware
app.use('*', secureHeaders());
app.use('*', cors({
  origin: (origin) => {
    const allowed = ['https://yourdomain.com', 'https://staging.yourdomain.com'];
    return allowed.includes(origin) ? origin : '';
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Health check (dependency-aware)
app.get('/health', async (c) => {
  const checks: Record<string, string> = {};
  try {
    await c.env.DB.prepare('SELECT 1').first();
    checks.database = 'connected';
  } catch { checks.database = 'error'; }
  try {
    await c.env.CACHE.get('_health');
    checks.cache = 'connected';
  } catch { checks.cache = 'error'; }

  const healthy = Object.values(checks).every(v => v === 'connected');
  return c.json({
    status: healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    env: c.env.ENVIRONMENT,
    checks,
  }, healthy ? 200 : 503);
});

// Mount routes
app.route('/api/items', itemRoutes);

// Global error handler
app.onError(errorHandler);

export default app;
```

### Route with Zod Validation

```typescript
// src/routes/items.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppEnv } from '../types/env';

const CreateItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

export const itemRoutes = new Hono<AppEnv>();

itemRoutes.post('/',
  zValidator('json', CreateItemSchema),
  async (c) => {
    const body = c.req.valid('json');
    const id = crypto.randomUUID();

    const result = await c.env.DB.prepare(`
      INSERT INTO items (id, name, description, tags, created_at)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `).bind(id, body.name, body.description ?? null, JSON.stringify(body.tags), Date.now()).first();

    await c.env.CACHE.delete('items:list');
    return c.json(result, 201);
  }
);

itemRoutes.get('/', async (c) => {
  const cached = await c.env.CACHE.get('items:list');
  if (cached) return c.json(JSON.parse(cached));

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM items WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 100'
  ).all();

  await c.env.CACHE.put('items:list', JSON.stringify(results), { expirationTtl: 300 });
  return c.json(results);
});
```

### Error Handler

```typescript
// src/middleware/errors.ts
import type { ErrorHandler } from 'hono';
import type { AppEnv } from '../types/env';

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const requestId = crypto.randomUUID();
  console.error(JSON.stringify({
    level: 'error',
    requestId,
    message: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
    timestamp: new Date().toISOString(),
  }));

  return c.json({ error: 'Internal server error', requestId }, 500);
};
```

### Rate Limiting Middleware

```typescript
// src/middleware/rateLimit.ts
import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types/env';

export const rateLimit = (maxPerMinute = 100): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
    const window = Math.floor(Date.now() / 60000);
    const key = `rate:${ip}:${window}`;

    const current = parseInt(await c.env.CACHE.get(key) ?? '0');
    if (current >= maxPerMinute) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }

    await c.env.CACHE.put(key, String(current + 1), { expirationTtl: 120 });
    await next();
  };
};
```

### Database Migrations

```sql
-- migrations/0001_initial.sql
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT DEFAULT '[]',
  metadata TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  deleted_at INTEGER DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_active ON items(deleted_at) WHERE deleted_at IS NULL;
```

### Wrangler Configuration

```jsonc
// wrangler.jsonc (v4 recommended format)
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "your-app",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",

  "env": {
    "staging": {
      "name": "your-app-staging",
      "routes": [{ "pattern": "api.staging.yourdomain.com/*", "zone_name": "yourdomain.com" }],
      "d1_databases": [{ "binding": "DB", "database_name": "your-app-staging", "database_id": "STAGING_DB_ID" }],
      "kv_namespaces": [{ "binding": "CACHE", "id": "STAGING_KV_ID" }],
      "r2_buckets": [{ "binding": "STORAGE", "bucket_name": "your-app-staging" }],
      "vars": { "ENVIRONMENT": "staging" }
    },
    "production": {
      "name": "your-app",
      "routes": [{ "pattern": "api.yourdomain.com/*", "zone_name": "yourdomain.com" }],
      "d1_databases": [{ "binding": "DB", "database_name": "your-app", "database_id": "PROD_DB_ID" }],
      "kv_namespaces": [{ "binding": "CACHE", "id": "PROD_KV_ID" }],
      "r2_buckets": [{ "binding": "STORAGE", "bucket_name": "your-app" }],
      "vars": { "ENVIRONMENT": "production" }
    }
  },

  "triggers": { "crons": ["0 2 * * *"] }
}
```

---

## Phase 3: Gastown Formulas (Repeatable Pipelines)

### Deploy to Staging

```toml
# .beads/formulas/deploy-staging.formula.toml
description = "Deploy to staging with migration"
formula = "deploy-staging"
version = 1

[[steps]]
id = "lint-test"
title = "Lint and test"
description = "Run npm run lint && npm test && npm run typecheck"

[[steps]]
id = "backup-db"
title = "Backup staging D1"
description = "Run wrangler d1 export DB --remote --env staging --output backups/staging-$(date +%Y%m%d-%H%M).sql"
needs = ["lint-test"]

[[steps]]
id = "migrate"
title = "Apply D1 migrations"
description = "Run wrangler d1 migrations apply DB --remote --env staging"
needs = ["backup-db"]

[[steps]]
id = "deploy"
title = "Deploy Worker to staging"
description = "Run wrangler deploy --env staging"
needs = ["migrate"]

[[steps]]
id = "smoke-test"
title = "Smoke test staging"
description = "Run curl -sf https://api.staging.yourdomain.com/health | jq .status"
needs = ["deploy"]

[[steps]]
id = "verify"
title = "Verify endpoints"
description = "Run npm run test:e2e -- --env staging"
needs = ["smoke-test"]
```

### Deploy to Production (Human-Gated)

```toml
# .beads/formulas/deploy-production.formula.toml
description = "Production deploy with approval gate"
formula = "deploy-production"
version = 1

[vars.version]
description = "Semantic version tag (e.g., 1.2.0)"
required = true

[[steps]]
id = "confirm-staging"
title = "Confirm staging is green"
description = "Run curl -sf https://api.staging.yourdomain.com/health | jq -e '.status == \"healthy\"'"

[[steps]]
id = "backup-prod-db"
title = "Backup production D1"
description = "Run wrangler d1 export DB --remote --env production --output backups/prod-$(date +%Y%m%d-%H%M).sql"
needs = ["confirm-staging"]

[[steps]]
id = "migrate-prod"
title = "Apply production migrations"
description = "Run wrangler d1 migrations apply DB --remote --env production"
needs = ["backup-prod-db"]

[[steps]]
id = "deploy-prod"
title = "Deploy to production"
description = "Run wrangler deploy --env production"
needs = ["migrate-prod"]

[[steps]]
id = "health-check"
title = "Production health check"
description = "Run curl -sf https://api.yourdomain.com/health | jq -e '.status == \"healthy\"'"
needs = ["deploy-prod"]

[[steps]]
id = "tag-release"
title = "Tag release"
description = "Run git tag -a v{{version}} -m 'Release v{{version}}' && git push --tags"
needs = ["health-check"]
```

### Execute Formulas

```bash
# From mobile SSH → Gastown Mayor, or directly:
bd cook deploy-staging
bd cook deploy-production --var version=1.2.0

# Or via trackable instance:
bd mol pour deploy-production --var version=1.2.0
bd mol list   # Track progress
```

---

## Phase 4: CI/CD Pipeline (GitHub Actions)

### PR Validation

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: ['agent/*', 'feature/*']

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
```

### Staging Auto-Deploy

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm test

      - name: Backup D1
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: d1 export DB --remote --env staging --output /tmp/backup.sql

      - name: Migrate D1
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: d1 migrations apply DB --remote --env staging

      - name: Deploy Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy --env staging

      - name: Smoke Test
        run: |
          sleep 5
          curl -sf https://api.staging.yourdomain.com/health | jq -e '.status == "healthy"'
```

### Production Deploy (Gated)

```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Release version (e.g., 1.2.0)'
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Requires human approval in GitHub settings
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm test

      - name: Verify staging health
        run: curl -sf https://api.staging.yourdomain.com/health | jq -e '.status == "healthy"'

      - name: Backup production D1
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: d1 export DB --remote --env production --output /tmp/prod-backup.sql

      - name: Migrate production D1
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: d1 migrations apply DB --remote --env production

      - name: Deploy production
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy --env production

      - name: Health check
        run: |
          sleep 5
          curl -sf https://api.yourdomain.com/health | jq -e '.status == "healthy"'

      - name: Tag release
        run: |
          git tag -a "v${{ inputs.version }}" -m "Release v${{ inputs.version }}"
          git push --tags

      - name: Rollback on failure
        if: failure()
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: rollback --env production
```

---

## Phase 5: Daily Development Workflow (Mobile)

### Starting a Session

```bash
# From Android — SSH into remote machine
mosh user@your-server
tmux attach -t dev

# Attach to Gastown Mayor
cd ~/gt
gt mayor attach

# Tell the Mayor what you want:
# "Build a /api/trips endpoint that fetches Tesla trip data from Tessie API,
#  stores it in D1, and caches results in KV for 5 minutes.
#  Create convoy, assign to polecat, deploy to staging when done."
```

### What the Mayor Does

1. Creates a convoy with beads for the feature
2. Spawns a Polecat worker agent in an isolated git worktree
3. Polecat reads CLAUDE.md, creates feature branch, implements the feature
4. Work state persists in hooks — survives context window exhaustion
5. IF agent session ends: new agent picks up from hook state (GUPP)
6. On completion: Polecat commits, pushes, creates PR
7. Mayor summarizes progress back to you

### Monitoring from Mobile

```bash
# Check convoy progress
gt convoy list
gt convoy show

# Check agent status
gt agents

# View Gastown dashboard (optional web UI)
gt dashboard --port 8080
# Access via SSH tunnel: ssh -L 8080:localhost:8080 user@server
```

### Reviewing on Mobile

- Open **GitHub Mobile** → review PR diff
- Approve or request changes
- Merge triggers CI/CD pipeline automatically
- Monitor deploy in GitHub Actions tab

---

## Security Model

### Credential Scoping

| Credential              | Scope                                          | Rotation    |
|-------------------------|-------------------------------------------------|-------------|
| Cloudflare API Token    | Workers (Edit), D1 (Edit), KV (Edit), R2 (Edit) | 90 days     |
| GitHub App Token        | Contents (RW), PRs (RW), Actions (RW)           | 1 hour auto |
| Wrangler Secrets        | Per-environment, per-Worker                      | On change   |

### Agent Identity

```bash
# Dedicated Git identity for agent commits
git config --global user.name "agent-bot"
git config --global user.email "agent-bot@yourdomain.com"

# GPG-sign agent commits
git config --global commit.gpgsign true
```

### Claude Code Permission Config

```json
// .claude/settings.json
{
  "permissions": {
    "allow": [
      "Read(**)",
      "Write(src/**)",
      "Write(test/**)",
      "Write(migrations/**)",
      "Bash(npm run *)",
      "Bash(wrangler *)",
      "Bash(gt *)",
      "Bash(bd *)",
      "Bash(gh pr *)",
      "Bash(git *)"
    ],
    "deny": [
      "Read(.env*)",
      "Read(**/secrets/**)",
      "Write(.github/workflows/**)",
      "Bash(curl * | bash)",
      "Bash(rm -rf /)"
    ]
  }
}
```

### Mandatory Guardrails

1. **Pre-commit hooks**: `truffleHog` or GitGuardian secret scanning
2. **GitHub Advanced Security**: Enable secret scanning on repo
3. **Branch protection**: Require PR review, passing CI, no force-push to main
4. **Environment gates**: Production deploys require human approval
5. **.gitignore**: `.env*`, `*.secret`, `backups/` — enforced, never overridden

---

## Recovery Procedures

### Agent Context Exhausted (GUPP)

```
No action needed. Gastown hooks persist work state.
1. Work is saved on the agent's git-backed hook
2. gt mayor attach — Mayor knows current state
3. Mayor resumes or reassigns the work to a new Polecat
```

### Failed Deployment

```bash
# Instant rollback to previous Worker version
wrangler rollback --env production

# Or pin specific version
wrangler versions list
wrangler versions deploy <version-id>@100%
```

### Failed D1 Migration

```bash
# If migration fails mid-execution: D1 auto-rolls back
# If migration succeeded but data is wrong:

# Option A: D1 Time Travel (within 30 days)
wrangler d1 time-travel restore DB --timestamp=2025-02-05T08:00:00Z

# Option B: Restore from backup
wrangler d1 execute DB --remote --env production --file backups/prod-20250205-0800.sql
```

### Remote Machine Down

```
All work persists in Git (Gastown hooks + Beads).
1. Spin up new machine
2. Clone repos, reinstall tools
3. gt install ~/gt --git
4. gt hooks repair
5. Resume where you left off
```

---

## Quick Reference Commands

### Gastown

```bash
gt mayor attach              # Start/resume Mayor session
gt convoy create "name" beads...  # Create work bundle
gt convoy list               # Check progress
gt sling <bead-id> <rig>     # Assign work to agent
gt agents                    # List active agents
gt hooks list                # List persistent hooks
gt hooks repair              # Fix broken hooks
gt prime                     # Context recovery in existing session
gt dashboard --port 8080     # Web monitoring UI
```

### Beads

```bash
bd formula list              # List available formulas
bd cook <formula>            # Execute formula
bd mol pour <formula>        # Create trackable instance
bd mol list                  # List active instances
```

### Wrangler

```bash
wrangler deploy --env staging       # Deploy to staging
wrangler deploy --env production    # Deploy to production
wrangler d1 migrations apply DB --remote --env staging
wrangler d1 export DB --remote --output backup.sql
wrangler d1 time-travel restore DB --timestamp=<ISO>
wrangler rollback --env production  # Instant rollback
wrangler secret put SECRET_NAME --env production
wrangler tail --env staging         # Live logs
```

### Claude Code

```bash
claude                       # Start interactive session
claude -c                    # Resume last session
claude --model opus          # Use specific model
/init                        # Generate CLAUDE.md from project
/compact                     # Manual context compaction
```

---

## Scaling Notes

For **solo projects** (like AWhittleWandering): Mayor + 1-2 Polecats is sufficient. Cost stays under $20/hour with Sonnet-based workers. Reserve Opus for Mayor coordination only.

For **team projects**: Full Gastown deployment with Witness (monitors health), Deacon (enforces policies), and Refinery (manages merges). Budget for $50-100/hour burn rate with 5-10 concurrent agents.

Gas Town degrades gracefully — every worker can operate independently. Start small, scale up as the project demands it.
