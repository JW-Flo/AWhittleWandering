# A Whittle Wandering - Continental USA Tesla Road Trip Tracker

🚗⚡ **Live at:** [awhittlewandering.com](https://awhittlewandering.com)

A sophisticated real-time Tesla road trip tracking application documenting a 48-state continental US adventure. Built with modern web technologies and enhanced with intelligent journey analytics.

## ✨ Enhanced Features

### 🎯 Core Capabilities

- **Real-Time Vehicle Tracking** - Live location, battery, and charging status
- **Smart Journey Intelligence** - Advanced route analytics and efficiency insights  
- **Interactive Timeline** - Detailed adventure logging with social interactions
- **Enhanced Milestones** - Gamified achievement system with rarity levels
- **Live Statistics Dashboard** - Comprehensive journey metrics and analytics
- **Security Hardened** - Production-ready authentication and rate limiting

### 🛡️ Security & Performance

- **Rate limiting** and API protection
- **Secure authentication** for admin features
- **Real-time data validation** with Zod schemas
- **CORS configuration** for cross-origin security
- **Production monitoring** and error handling

### 📊 Advanced Analytics

- **Journey Intelligence Engine** - Drive segment analysis and optimization
- **Efficiency Tracking** - Miles per kWh and energy consumption
- **Social Journey Metrics** - People met and interactions logged
- **Weather Impact Analysis** - Temperature effects on range and efficiency
- **State Detection** - Automatic boundary crossing detection

## 🏗️ Architecture

### Frontend (React + TypeScript)

- **Framework:** Vite + React 18 + TypeScript
- **UI Library:** Radix UI + TailwindCSS + shadcn/ui
- **State Management:** React Query + Custom Hooks
- **Maps:** Mapbox GL JS with custom Tesla visualizations
- **Deployment:** Cloudflare Pages

### Backend (Cloudflare Workers)

- **Runtime:** Cloudflare Workers + Hono Framework
- **API Integration:** Tessie Tesla API + OpenWeather
- **Data Processing:** Real-time telemetry analysis
- **Security:** JWT authentication + Rate limiting

### Data Layer

- **Schemas:** Shared TypeScript/Zod validation
- **Storage:** Local state + API integration
- **Processing:** Client-side analytics engine

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Tessie API key (for live Tesla data)
- Mapbox API token (for enhanced maps)

### Development Setup

```bash
# Clone and install dependencies
git clone <repository-url>
cd ContinentalUSA
npm install

# Start development servers
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy
```

### Environment Configuration

```bash
# Frontend (.env)
VITE_API_BASE_URL=https://awhittlewandering-api.kd8jc7v8cd.workers.dev
VITE_MAPBOX_TOKEN=your_mapbox_token

# Backend (wrangler.toml)
TESSIE_API_KEY=your_tessie_api_key
OPENWEATHER_API_KEY=your_weather_api_key
```

## 📁 Project Structure

```
ContinentalUSA/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # Enhanced UI components
│   │   │   ├── SmartVehicleStats.tsx
│   │   │   ├── SmartTimeline.tsx
│   │   │   ├── RealTimeLocationTracker.tsx
│   │   │   └── AdventureMilestones.tsx
│   │   ├── utils/           # Enhanced utilities
│   │   │   ├── securityConfig.ts
│   │   │   └── journeyIntelligence.ts
│   │   └── hooks/           # Custom React hooks
├── backend/                 # Cloudflare Workers
│   └── edge-worker/         # API server
├── shared/                  # Shared TypeScript schemas
└── data/                    # Journey data and telemetry
```

## 🎮 Enhanced Components

### SmartVehicleStats

- Real-time battery and range monitoring
- Journey progress with state completion tracking
- Advanced efficiency analytics and trends
- Weather-adjusted range predictions

### SmartTimeline  

- Interactive event filtering and categorization
- Social interaction tracking and people met
- Detailed journey insights with efficiency metrics
- Map integration with location-based events

### RealTimeLocationTracker

- Live GPS tracking with accuracy metrics
- Connection status and auto-refresh capabilities
- Journey progress visualization
- Detailed vehicle metrics and alerts

### AdventureMilestones

- Gamified achievement system with rarity levels
- Distance, time, and social interaction milestones
- Point-based scoring system
- Celebration animations and progress tracking

## 🔧 Advanced Features

### Journey Intelligence Engine

```typescript
// Automatic drive segment analysis
const segments = journeyEngine.analyzeDriveSegments(telemetryData);

// State detection and transitions  
const stateChanges = journeyEngine.detectStateTransitions(locations);

// Efficiency optimization suggestions
const insights = journeyEngine.generateJourneyInsights(vehicle, weather);
```

### Security Configuration

```typescript
// Production-ready rate limiting
const rateLimiter = securityConfig.createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
});

// API validation and CORS
const corsConfig = securityConfig.getCORSConfig('production');
```

## 📈 Performance & Monitoring

- **Bundle Size:** Optimized with code splitting and lazy loading
- **API Performance:** Edge-deployed workers with <100ms response times  
- **Real-time Updates:** WebSocket-like polling with smart refresh intervals
- **Error Tracking:** Comprehensive error boundaries and logging

## 🌟 Journey Highlights

- **29 States Conquered** (60.4% completion)
- **11,950+ Miles** driven across America
- **56 Days** of epic adventure
- **Real-time tracking** with live updates
- **Advanced analytics** and journey intelligence

## 🚀 Deployment

The application is deployed and live at:

- **Frontend:** [awhittlewandering.com](https://awhittlewandering.com) (Cloudflare Pages)
- **API:** [awhittlewandering-api.kd8jc7v8cd.workers.dev](https://awhittlewandering-api.kd8jc7v8cd.workers.dev) (Cloudflare Workers)

### Automated Deployment & CI/CD

| Component | Workflow / Script | Purpose |
|-----------|-------------------|---------|
| Frontend (Pages) | `.github/workflows/frontend-pages-deploy.yml` | Auto build & deploy React app to Cloudflare Pages on `main` changes under `frontend/**` |
| Backend Worker | (manual `bun run deploy` for now) | Deploy Hono/Workers API (future workflow may automate) |
| DevSecOps CI (scaffold) | `docs/.github/workflows/ci.yml` | Example build + security scans (Semgrep/Bandit/Trivy) |
| Infra Deploy (example) | `docs/.github/workflows/deploy.yml` | Example Terraform + Worker pattern (reference only) |
| Web App QA | `bun run webapp:qa` (`scripts/webapp-qa.sh`) | End‑to‑end local build + optional health probe |
| Backend Smoke QA | `scripts/backend-smoke-qa.sh` | Remote API status verification (health, unified-data, config, components) |
| Unified Data Schema | `backend/edge-worker/src/qa/unified-data.schema.json` + `validate-unified.ts` | Contract/schema validation for aggregated journey endpoint |

### Frontend (Cloudflare Pages) Deployment
1. Build locally (optional): `bun run build:frontend`
2. Push to `main` with changes in `frontend/**` → GitHub Action runs.
3. Required GitHub Secrets:
  - `CF_ACCOUNT_ID` – Cloudflare Account ID
  - `CF_PAGES_TOKEN` – API token with Pages write permission
4. Action runs: install Bun → workspace install → build → `wrangler pages deploy dist`.

Manual (fallback) deploy:
```bash
cd frontend && bun run build && wrangler pages deploy dist --project-name=awhittlewandering-frontend
```

### Backend (Cloudflare Worker) Deployment
Current pattern uses manual / local deploy:
```bash
cd backend/edge-worker
bun run build
bun run deploy   # wrangler dev/prod deploy (configured in worker package.json)
```
Planned improvement: dedicated GitHub Action mirroring Pages pipeline (add caching + D1 migrations check).

### QA & Validation Scripts
| Command | Description |
|---------|-------------|
| `bun run webapp:qa` | Builds shared, backend, frontend; runs contract/schema QA if present; optional remote health probe. |
| `scripts/backend-smoke-qa.sh` | CURL-based smoke tests of production/dev API endpoints. |
| `backend/edge-worker/src/qa/validate-unified.ts` | Lightweight runtime validation for unified-data response shape. |

### Unified Data Contract / Caching
The unified aggregation endpoint (`/api/v1/unified-data`) now has:
* D1 short‑TTL cache row (`api_cache` table key `unified_data_latest_v2`) to reduce recomputation.
* JSON schema (`unified-data.schema.json`) + validator script for CI / manual QA.
* Diagnostic/admin tooling (temporary) used during recent 500 resolution — remove or restrict before major release.

### Required / Notable Secrets & Env Vars
| Usage | Name | Where |
|-------|------|-------|
| Cloudflare Pages Deploy | `CF_ACCOUNT_ID` | GitHub Secrets |
| Cloudflare Pages Deploy | `CF_PAGES_TOKEN` | GitHub Secrets |
| Worker Deploy / API (existing) | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | Local env / future workflow |
| Tessie Integration | `TESSIE_API_KEY` | Worker binding / env |
| Mapbox Maps | `VITE_MAPBOX_TOKEN` | Frontend `.env` |

### Operational Notes
* Large map vendor bundle (~1.5MB) already isolated; further splitting possible via additional dynamic imports if performance becomes a concern.
* Add new aggregator endpoints following cache pattern to avoid per-request D1 heavy scans.
* When extending health checks, only append fields (maintain backward compatibility for consumers).

---

## 🔄 Recent Enhancements

### v2.0 - Intelligence Integration

- ✅ Enhanced journey intelligence engine
- ✅ Advanced security configurations  
- ✅ Smart vehicle statistics with analytics
- ✅ Interactive timeline with filtering
- ✅ Real-time location tracking
- ✅ Gamified milestone system
- ✅ Production-ready deployment

### Next Phase

- � Enhanced map visualizations
- 🔄 Advanced route optimization
- 🔄 Social sharing capabilities
- 🔄 Historical data analysis

## 🤝 Contributing

This is a personal journey documentation project. The codebase serves as a reference for building sophisticated Tesla tracking applications with modern web technologies.

---

**Built with ❤️ for the open road and electric adventures** ⚡🏔️

## 🏗️ Architecture

This is a modern, cloud-native application built with performance and scalability in mind:

```
├── backend/edge-worker/    # Cloudflare Worker API (Global Edge Deployment)
│   ├── src/index.ts       # Hono-based API with Tesla telemetry endpoints
│   ├── wrangler.toml      # Cloudflare Workers configuration
│   └── package.json       # Worker dependencies (Hono, Zod validation)
├── frontend/              # React Dashboard ✅ LIVE
│   ├── src/               # TypeScript React components
│   ├── components/        # UI components with Tesla integration
│   ├── hooks/             # Custom hooks for API integration
│   ├── utils/             # Route visualization and data processing
│   └── package.json       # Frontend dependencies (React, Vite, Tailwind)
├── shared/                # Common Types & Schemas
│   ├── schemas/tesla.ts   # Zod schemas for Tesla data validation
│   └── package.json       # Shared utilities and types
├── scripts/               # Automation & Deployment
│   ├── deploy.sh          # One-command deployment script
│   ├── import-tesla-data.ts # CSV import for Tesla telemetry data
│   └── monitoring.ts      # Health checks and alerts
└── data/                  # Trip Data Storage
    ├── battery_states.csv # Tesla battery telemetry exports
    ├── charging_sessions/ # Supercharger session logs
    └── trip_logs/         # Daily journey summaries
```

## 🚀 Quick Start

### Prerequisites

- **Bun** (v1.2+) - Fast JavaScript runtime and package manager
- **Git** - Version control
- **Cloudflare Account** - For Workers deployment (free tier works)
- **Tesla Account** - For vehicle data access

### Installation

```bash
# Clone the repository
git clone https://github.com/JW-Flo/AWhittleWandering.git
cd AWhittleWandering

# Install all dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your Cloudflare and Tesla credentials
```

### Development

```bash
# Start local development server
bun run dev

# Run in development mode with hot reload
bun run dev:worker

# Build for production
bun run build

# Run tests
bun run test
```

### Deployment

```bash
# Deploy everything (API + Frontend)
bun run deploy

# Deploy only the API
bun run deploy:api

# Deploy only the frontend
bun run deploy:frontend

### Additional Deployment Utilities

| Script / Task | Description |
|---------------|-------------|
| `bun run shell:integrate` | Installs VS Code terminal shell integration for enriched agent context |
| `bun run webapp:qa` | Composite build & QA pass (see above) |
| `bun run build:all` | Shared → backend → frontend build chain |
| `scripts/install-shell-integration.sh` | Idempotent shell integration script |

```

## 🔌 Tesla Integration

### Data Sources

- **Tesla Mobile Connector API**: Real-time vehicle telemetry
- **CSV Exports**: Historical battery and charging data
- **Supercharger Network API**: Station locations and availability
- **Tesla Fleet API**: Enhanced vehicle data (if available)

### Supported Data Types

- ⚡ **Battery Telemetry**: State of charge, voltage, temperature, charging rate
- 📍 **Location Data**: GPS coordinates, elevation, heading, speed
- 🚗 **Vehicle Status**: Doors, windows, climate control, software version
- 🔌 **Charging Sessions**: Start/end times, energy added, cost, station details
- 🛣️ **Trip Segments**: Distance traveled, efficiency, weather conditions

### Data Import Process

```bash
# Import Tesla CSV exports
bun run tesla:import --file=data/battery_states.csv

# Sync with Tesla API (requires authentication)
bun run tesla:sync --vehicle-id=YOUR_VEHICLE_ID

# Process and analyze trip data
bun run tesla:analyze --start-date=2025-07-01
```

## 🌐 API Documentation

**Base URL**: `https://awhittlewandering-api.kd8jc7v8cd.workers.dev`

### Core Endpoints

#### Tesla Telemetry

```bash
POST /api/v1/telemetry
```

Submit real-time Tesla vehicle data

```json
{
  "timestamp": "2025-07-26T12:00:00Z",
  "battery": {
    "stateOfCharge": 85.5,
    "rangeRemaining": 280,
    "chargingState": "Disconnected"
  },
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "elevation": 10
  },
  "vehicle": {
    "speed": 65,
    "heading": 45,
    "odometer": 12500
  }
}
```

#### Trip Status

```bash
GET /api/v1/trip/status
```

Get current trip progress and statistics

```json
{
  "statesVisited": 12,
  "totalStates": 48,
  "currentState": "New York",
  "milesTracked": 3420,
  "daysOnRoad": 8,
  "nextDestination": "Connecticut"
}
```

#### Health Check

```bash
GET /health
```

API health and status monitoring

```json
{
  "status": "ok",
  "timestamp": 1753537886408,
  "version": "1.0.0"
}
```

## 📊 Data Schema

### Tesla Telemetry Schema (Zod Validation)

```typescript
const TeslaTelemetrySchema = z.object({
  timestamp: z.string().datetime(),
  battery: z.object({
    stateOfCharge: z.number().min(0).max(100),
    rangeRemaining: z.number().min(0),
    chargingState: z.enum(['Charging', 'Disconnected', 'Complete']),
    chargeRate: z.number().optional(),
    batteryTemp: z.number().optional()
  }),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    elevation: z.number().optional(),
    accuracy: z.number().optional()
  }),
  vehicle: z.object({
    speed: z.number().min(0),
    heading: z.number().min(0).max(360),
    odometer: z.number().min(0),
    softwareVersion: z.string().optional()
  })
});
```

## 🔧 Configuration

### Environment Variables

```bash
# Cloudflare Workers
CLOUDFLARE_API_TOKEN=your_cloudflare_token
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Tesla API (if using official API)
TESLA_ACCESS_TOKEN=your_tesla_token
TESLA_VEHICLE_ID=your_vehicle_id

# Database (optional - for persistent storage)
DATABASE_URL=your_database_connection_string

# Monitoring & Alerts
WEBHOOK_URL=your_monitoring_webhook
```

### Cloudflare Workers Configuration

```toml
# wrangler.toml
name = "awhittlewandering-api"
main = "dist/worker.js"
compatibility_date = "2024-07-01"

[vars]
ENVIRONMENT = "production"
API_VERSION = "v1"

[[kv_namespaces]]
binding = "TRIP_DATA"
id = "your_kv_namespace_id"
```

## 🚗 Road Trip Features

### State Tracking

- **Visual Progress Map**: Interactive US map showing visited states
- **State Checklist**: 48-state completion tracker with timestamps
- **Route Optimization**: Suggested efficient paths to unvisited states
- **Milestone Celebrations**: Automated alerts for state #10, #25, #40, #48

### Charging Network Analysis

- **Supercharger Mapping**: All charging stops with session details
- **Cost Tracking**: Total charging costs and per-kWh pricing
- **Charging Speed Analysis**: Peak rates and optimal charging windows
- **Network Coverage**: Gaps in charging infrastructure along routes

### Performance Insights

- **Efficiency Tracking**: Miles per kWh across different terrains
- **Weather Impact**: How temperature affects battery performance
- **Driving Patterns**: Highway vs city efficiency comparisons
- **Range Predictions**: AI-powered remaining range estimates

## 📱 Frontend Dashboard ✅ LIVE

**Current Status**: Fully functional React-based dashboard with real-time data integration!

**Live Features**:

- 🗺️ **Interactive Maps**: Real-time vehicle location with 3D terrain visualization
- 📊 **Live Analytics**: Battery performance and journey progress charts  
- 📋 **Trip Timeline**: Real-time journey updates with 29 states conquered
- ⚡ **Route Planner**: Interactive planning with Tesla Supercharger integration
- 🎯 **Progress Tracking**: State completion tracker with live data
- 🌟 **Advanced Maps**: 3D terrain, satellite imagery, and route animation
- 📍 **Live Journey**: Real-time vehicle status and location tracking
- 🚗 **Vehicle Status**: Live battery level, range, and charging state

**Access**: Visit the live dashboard at `http://localhost:8082/` when running locally.

## 🛠️ Technology Stack

**Backend**:

- **Cloudflare Workers** - Global edge compute for ultra-low latency
- **Hono** - Fast, lightweight web framework
- **TypeScript** - Type-safe development
- **Zod** - Runtime schema validation
- **Bun** - Fast JavaScript runtime and package manager

**Frontend** (Planned):

- **React 18** - Modern UI framework
- **Vite** - Fast build tooling
- **Tailwind CSS** - Utility-first styling
- **Mapbox** - Interactive mapping
- **Chart.js** - Data visualization

**Data & Infrastructure**:

- **Cloudflare KV** - Edge key-value storage
- **GitHub Actions** - CI/CD automation
- **Tesla API** - Vehicle data integration

## 🤝 Contributing

We welcome contributions! This project documents a real Tesla road trip adventure.

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code style and formatting
- Add tests for new functionality
- Update documentation for API changes
- Ensure all builds pass before submitting PR

## 📈 Roadmap

### Phase 1: Core Infrastructure ✅ COMPLETED

- [x] Cloudflare Workers API deployment
- [x] Tesla telemetry data ingestion
- [x] TypeScript schemas and validation
- [x] Basic health monitoring

### Phase 2: Enhanced Tessie API Integration ✅ COMPLETED  

- [x] Complete Tessie API integration with drive/charge history
- [x] Real-time journey dashboard with comprehensive analytics
- [x] Enhanced map visualization with actual route data
- [x] Extended stay detection and categorization
- [x] Admin-secured API configuration management

### Phase 3: Advanced Map Visualization ✅ COMPLETED

- [x] React dashboard development with live data
- [x] Interactive mapping with Mapbox and 3D terrain
- [x] Advanced route visualization with animation
- [x] Interactive route planner with Tesla Supercharger integration
- [x] Real-time trip progress visualization
- [x] Douglas-Peucker route smoothing and optimization

### Phase 4: Admin Media Management 🚧 IN PROGRESS

- [ ] Photo/video upload and management system
- [ ] Trip media gallery with timeline integration
- [ ] Admin authentication for media operations
- [ ] Media organization and categorization tools
- [ ] Social sharing integration

### Phase 5: Enhanced Timeline Features 📋 PLANNED

- [ ] Interactive timeline with media integration
- [ ] Advanced journey analytics and insights
- [ ] Achievement system and milestone tracking
- [ ] Weather impact analysis and visualization

### Phase 6: Performance Optimization 🎯 PLANNED

- [ ] Route optimization algorithms
- [ ] Predictive analytics for charging stops
- [ ] Mobile app development
- [ ] Advanced caching and performance tuning

## 📧 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/JW-Flo/AWhittleWandering/issues)
- **Discussions**: [GitHub Discussions](https://github.com/JW-Flo/AWhittleWandering/discussions)
- **Email**: [joe@awhittlewandering.com](mailto:joe@awhittlewandering.com)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tesla** - For building amazing electric vehicles that make road trips like this possible
- **Cloudflare** - For providing global edge infrastructure
- **Open Source Community** - For the incredible tools that power this project

---

**Follow the Journey**: Track our real-time progress as we adventure across all 48 continental US states in a Tesla! ⚡🗺️
