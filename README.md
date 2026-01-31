# A Whittle Wandering

🚗⚡ **Live:** [awhittlewandering.com](https://awhittlewandering.com)

A journey platform that turns movement into meaning—experienced by others while it’s happening and remembered afterward as a coherent narrative.

## Features

- Live journey presence (where they are *in the arc*, not just on the map)
- Narrative “moments” (photos/notes/milestones) that punctuate the trip
- Journeyer command center (vehicle data, routing, AI assistance) without burdening the public view
- Secure API with authentication
- Unified API model and privacy-first telemetry

## Architecture

- **Frontend:** React + TypeScript + Mapbox
- **Backend:** Cloudflare Workers + Hono + D1  
- **Vehicle integration:** Provider adapters (Tessie/Tesla today, OEMs next)

## Quick Start

```bash
git clone <repository-url>
cd AWhittleWandering
npm install && npm run dev
```

### Environment

```bash
# Backend (.dev.vars)
TESSIE_API_TOKEN=your_token
ADMIN_TOKEN=your_token
JWT_SECRET=your_secret

# Frontend (.env)
VITE_API_BASE_URL=https://your-worker.workers.dev
VITE_MAPBOX_TOKEN=your_token
```

## Project Structure

```
├── frontend/                 # React app
├── backend/edge-worker/      # Consolidated worker
│   ├── src/
│   │   ├── middleware/       # CORS, rate limiting  
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Cache, aggregation
│   │   └── schemas/          # Validation
│   └── tests/                # Unit/contract tests
├── shared/                   # Common types
└── archive/workers/          # Legacy workers
```

## API

**Base:** `https://awhittlewandering-api.kd8jc7v8cd.workers.dev`

- `GET /api/v1/health` - Service status
- `GET /api/v1/unified-data` - Journey data (single source of truth)
- `GET /api/v1/journeys` - Public journey list
- `GET /api/v1/journeys/:id/stats` - Journey statistics

## Testing

```bash
npm run qa:core              # Core QA
npm test                     # Unit tests
npm run test:contract         # Unified contract checks
npm run test:schema           # Schema validation
```

See [docs/](docs/) for guides and detailed documentation.

## Tech Stack

**Core:** TypeScript, Hono, Zod, Vitest  
**Frontend:** React, Vite, TailwindCSS, Mapbox  
**Backend:** Cloudflare Workers, D1, R2

## Tesla Data

**Source:** Tessie API  
**Types:** Battery, location, charging, trips  
**Processing:** Real-time with caching

## Status

✅ Modular architecture, real-time tracking, dashboard
📋 Planned: Multi-OEM adapters, narratives, analytics, media

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full operating roadmap.

## Archived Workers

Legacy workers consolidated and moved to `archive/workers/`:

- `docs-workers` (example worker)
- `mcp-server-cloud` (MCP server)

## Contributing

Fork → feature branch → tests → PR

## Support

- **Issues:** [GitHub Issues](https://github.com/JW-Flo/AWhittleWandering/issues)
- **Email:** <joe@awhittlewandering.com>

## License

MIT - see [LICENSE](LICENSE)

---

**Live Journey:** 48 states, real-time Tesla tracking! ⚡🗺️
