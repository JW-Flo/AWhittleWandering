# A Whittle Wandering 🚗⚡

Real-time Tesla road trip tracker for a 48 continental US states journey.

## Structure

```
├── backend/edge-worker/    # Cloudflare Worker API
├── frontend/               # React dashboard (coming soon)
├── shared/                 # Common schemas and types  
├── scripts/                # Deployment and data tools
└── data/                   # Trip data and telemetry
```

## Quick Start

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Deploy to production
bun run deploy

# Import Tesla data
bun run tesla:import
```

## Tesla Integration

- **Battery Data**: Import from Tesla API/CSV exports
- **Real-time Telemetry**: Live location and vehicle status
- **Trip Tracking**: 48-state route progress
- **Charging Stops**: Station locations and charging sessions

## API Endpoints

- `POST /api/v1/telemetry` - Submit Tesla telemetry data
- `GET /api/v1/trip` - Get current trip status
- `GET /health` - Health check

Built with Cloudflare Workers, Bun, and TypeScript.
