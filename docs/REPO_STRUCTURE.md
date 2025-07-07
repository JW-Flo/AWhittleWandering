# Repository Structure

This monorepo is organized around four top-level domains that map directly to runtime environments and deployment targets:

```
.
├── frontend      # React/Vite web application
├── ios           # Native iOS Swift package / Xcode workspace
├── backend       # Cloudflare Workers, Node APIs, and other server logic
└── mcp           # Micro-services (Model-Context-Protocol servers) supporting web, iOS, and backend
```

| Folder   | Purpose | Build / Deploy |
|----------|---------|----------------|
| **frontend** | Web UI, built with React 19, Vite, Vitest, Tailwind. | `bun run build --filter frontend` → static assets deployed to Pages / CDN. |
| **ios** | Native Swift code (previously `ios/ios-client`). Fastlane + Xcode build scripts reside here. | `fastlane ios build` or Xcode Cloud. |
| **backend** | Cloudflare **edge-worker** plus supporting `workers/` TypeScript services. All server-side APIs that power both web and iOS. | `bun run build --filter backend` then `wrangler deploy`. |
| **mcp/** | One sub-folder per MCP tool server (`code-analysis-server`, `doc-processing-server`, etc.). Each is containerised via Docker. | `docker-compose up -d` or GitHub Actions job per service. |

## Workspace Configuration

`package.json`

```json
"workspaces": [
  "frontend",
  "ios",
  "backend",
  "mcp/*",
  "shared"
]
```

## Rationale

1. **Separation of Concerns** – Web, Mobile, Server, and Micro-services evolve independently and have distinct pipelines.
2. **Clear On-boarding** – New engineers instantly know where code for their platform lives.
3. **Scalability** – Each domain can be subdivided internally (e.g., `backend/edge-worker`, `backend/express-api`) without polluting the root.
4. **CI Simplicity** – GitHub workflow matrix can target the four workspaces for install, lint, test, and deploy.

## Moving legacy paths

| From | To |
|------|----|
| `ios/ios-client` | `ios` |
| `awhittlewandering/packages/frontend` | `frontend` |
| `awhittlewandering/workers/*` → `backend/workers/*` |  |
| `backend/edge-worker` (already correct) | remains under **backend** |

All scripts, CI configs, and import paths have been updated accordingly.
