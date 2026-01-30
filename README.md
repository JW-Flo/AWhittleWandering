# A Whittle Wandering

🚗⚡ **Live:** [awhittlewandering.com](https://awhittlewandering.com)

A journey platform that turns movement into meaning—experienced by others while it’s happening and remembered afterward as a coherent narrative.

## Features

- Live journey presence (where they are *in the arc*, not just on the map)
- Narrative “moments” (photos/notes/milestones) that punctuate the trip
- Journeyer command center (vehicle data, routing, AI assistance) without burdening the public view
- Secure API with authentication

## Architecture

- **Frontend:** React + TypeScript + Mapbox
- **Backend:** Cloudflare Workers + Hono + D1  
- **Vehicle integration:** Tessie API (Tesla)

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
- `GET /api/v1/unified-data` - Journey data  
- `POST /api/v1/telemetry` - Vehicle data
- `POST /api/v1/admin/*` - Admin ops

## Testing

```bash
npm run qa:core              # Full QA
npm test                     # Unit tests
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
📋 Planned: Media gallery, mobile app

See [docs/ROADMAP.md](docs/ROADMAP.md) for roadmap.

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
