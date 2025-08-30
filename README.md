# A Whittle Wandering - Tesla Road Trip Tracker

🚗⚡ **Live:** [awhittlewandering.com](https://awhittlewandering.com)

Real-time Tesla road trip tracking across 48 continental US states.

## Features

- Real-time vehicle tracking (location, battery, charging)
- Journey analytics and efficiency insights  
- Interactive dashboard with live metrics
- Secure API with authentication

## Architecture

- **Frontend:** React + TypeScript + Mapbox
- **Backend:** Cloudflare Workers + Hono + D1  
- **Integration:** Tessie Tesla API

## Quick Start

```bash
git clone <repository-url>
cd AWhittleWandering
npm install && npm run dev
```

### Environment

```bash
# Backend (.dev.vars)
TESSIE_API_KEY=your_key
ADMIN_TOKEN=your_token

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

See [QA.md](QA.md) for details.

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

See [FUTURE_QUALITY.md](FUTURE_QUALITY.md) for roadmap.

## Archived Workers

Legacy workers consolidated and moved to `archive/workers/`:
- `docs-workers` (example worker)
- `mcp-server-cloud` (MCP server)

## Contributing

Fork → feature branch → tests → PR

## Support

- **Issues:** [GitHub Issues](https://github.com/JW-Flo/AWhittleWandering/issues)
- **Email:** joe@awhittlewandering.com

## License

MIT - see [LICENSE](LICENSE)

---

**Live Journey:** 48 states, real-time Tesla tracking! ⚡🗺️