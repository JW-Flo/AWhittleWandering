# Continental USA – Monorepo  

Real-time Tesla road-trip tracker rebuilt as a **pnpm monorepo** with shared code, Cloudflare Workers backend, React web frontend, native iOS client, and multiple MCP servers.

## Directory Layout

```
frontend/          # React + Vite web app
backend/
  ├─ workers/      # Cloudflare Workers (api, site, proxies…)
  └─ edge-worker/  # Cloudflare Edge-Worker service (Wrangler)
ios/               # Xcode Swift Package app
shared/
  └─ schemas/      # Zod schemas shared across workspaces
mcp/*              # Independent MCP servers (unchanged)
```

## Prerequisites

| Tool | Version |
|------|---------|
| Node | 20+ |
| pnpm | 9+ |
| Wrangler | 4+ |
| Xcode | 15+ (for iOS build) |

Clone, then install all workspaces once:

```bash
git clone https://github.com/JW-Flo/ContinentalUSA.git
cd ContinentalUSA
pnpm install --frozen-lockfile
```

> The repo uses **pnpm workspaces** – one install sets up every package.

## Environment Variables

Create `.env` at the repo root:

```env
# --- Cloudflare ---
CLOUDFLARE_API_TOKEN=xxxxxxxx
CLOUDFLARE_ACCOUNT_ID=xxxxxxxx
CLOUDFLARE_ZONE_ID=xxxxxxxx     # needed for Pages / KV

# --- Vehicle Telemetry (Tessie) ---
TESSIE_API_TOKEN=xxxxxxxx
TESSIE_VIN=xxxxxxxxxxxxxxxxx

# --- Mapbox ---
MAPBOX_TOKEN=pk.ey...
MAPBOX_API_TOKEN=sk.ey...

# --- OpenWeather ---
OPENWEATHER_API_KEY=xxxxxxxx

# --- Security ---
EDGE_HMAC_KEY=superSecretKey
```

## Workspace Scripts

| Command | Purpose |
|---------|---------|
| `pnpm run dev --filter frontend` | Start React dev server |
| `pnpm run dev --filter backend`  | Start Miniflare (local workers) |
| `pnpm run build --filter <workspace>` | Build any workspace (matrix CI) |
| `pnpm run test --recursive` | Run all Vitest tests |
| `pnpm run lint` / `pnpm run check-types` | Lint & type-check at root |

### Typical Dev Loop

```bash
# Front-end
pnpm run dev --filter frontend

# API Workers (live reload)
pnpm run dev --filter backend
```

## Deployment

### GitHub Actions (recommended)

Push to **staging** or open a PR – the updated `.github/workflows/ci.yml`:

1. Installs deps once  
2. Lints & type-checks root  
3. Builds matrix `frontend, backend, shared`  
4. Runs vitest recursively  
5. Publishes **backend/edge-worker** via Wrangler on staging / PRs

Production deploy triggers on `main`.

### Manual Wrangler Deploy

```bash
# Build workspaces
pnpm run build --filter frontend
pnpm run build --filter backend

# Deploy edge worker (API + site proxy)
cd backend/edge-worker
npx wrangler deploy --env=production
```

## Shared Schemas

`shared/schemas/telemetrySchema.ts` defines the canonical vehicle telemetry model via Zod:

```ts
import { z } from 'zod';

export const TelemetrySchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timestamp: z.number(),
  batteryLevel: z.number().optional(),
  charging: z.boolean().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  altitude: z.number().optional(),
  temperature: z.number().optional(),
});

export type Telemetry = z.infer<typeof TelemetrySchema>;
```

Import it in any workspace:

```ts
import { TelemetrySchema } from 'shared/schemas/telemetrySchema';
```

## Code Structure Highlights

| Path | Description |
|------|-------------|
| `frontend/src/` | React pages, components, hooks |
| `backend/workers/*.ts` | KV-caching API Worker scripts |
| `backend/edge-worker/src/` | Edge-worker entrypoint, HMAC auth |
| `shared/` | Runtime-agnostic utilities & type defs |
| `ios/ios-client/` | Swift Package with UIKit / SwiftUI views |
| `mcp/*` | Dockerised MCP tools (code-analysis, test-runner, etc.) |

## Troubleshooting

1. **pnpm install fails** – ensure Node 20+, pnpm 9+, and no npm lockfiles.
2. **Local worker 403** – check `EDGE_HMAC_KEY` matches client header.
3. **Map blank** – verify `MAPBOX_TOKEN` set and referrer allowed.
4. **CI red** – run `pnpm run lint && pnpm run check-types && pnpm run test --recursive` locally.

## License

MIT
