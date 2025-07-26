# A Whittle Wandering 🚗⚡

**Real-time Tesla road trip tracker for a 48 continental US states journey**

This application tracks a Tesla vehicle's journey across all 48 continental United States, providing real-time telemetry, battery monitoring, charging station mapping, and trip progress visualization. Built for road trip enthusiasts who want to document their electric vehicle adventures with detailed analytics.

## 🎯 Project Overview

**Mission**: Document and visualize a complete Tesla road trip across all 48 continental US states with real-time data collection, battery optimization insights, and charging network analysis.

**Current Status**: ✅ **Phase 3 Complete** - Advanced map visualization and route planning now fully functional!

**Key Features**:
- 📊 **Real-time Tesla Telemetry**: Live battery levels, location tracking, and vehicle status
- 🗺️ **Interactive Trip Mapping**: Visual progress across all 48 states with route optimization  
- ⚡ **Charging Analytics**: Supercharger usage, charging session analysis, and cost tracking
- 📈 **Battery Performance**: State-of-charge monitoring, range prediction, and efficiency metrics
- 🎯 **State Progress**: Track which states have been visited and plan remaining destinations
- 📱 **Live Dashboard**: Real-time updates for friends and family following the journey
- 🌟 **Advanced Maps**: 3D terrain visualization, route animation, and satellite imagery
- 🔍 **Route Planner**: Interactive planning with Tesla Supercharger integration

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
