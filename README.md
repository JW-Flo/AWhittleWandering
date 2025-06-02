# ContinentalUSA
App to manage 48 state continental drive 
A fully autonomous, 60-day EV-road-trip planner. • Collects read-only telemetry (state-of-charge, location, charging events) every 15 min while driving or charging. • Feeds data to an on-device algorithm that selects the next Supercharger/fallback L2 site using offline ABRP matrices. • Transmits high-level stats (leg complete, arrival %, charging cost) to the driver's personal Cloudflare Worker for post-trip analytics. **No remote commands** are issued (start-charge, unlock, climate, etc.). Data never shared with third parties; solely for personal trip logistics and energy budgeting.

## Project Progress

- Public website built with React + Vite + Windi CSS for modern, responsive UI
- Live route status with real-time updates from Cloudflare Worker
- Interactive Mapbox map showing current location
- Dark mode toggle with persistent user preference
- Photo gallery with lightbox functionality
- Trip logs management with add/delete
- Tabbed navigation with URL hash support
- Offline support with service worker caching
- Accessibility improvements with ARIA roles and keyboard navigation
- GitHub Actions CI/CD for automatic deployment to Cloudflare Pages

## Next Steps

- Refactor Tesla API integration to work with Cloudflare Workers limitations
- Move Tesla API calls to an external backend service or rewrite with direct HTTP calls
- Implement secure authentication and token management for Tesla API
- Enhance trip logs and comments with backend persistence
- Add more interactive features like social sharing, notifications, and media uploads

## Quick Start

### Public Website (Remote Access)

```bash
# from repo root
cd 48Continental_Starter/public-site

# install dependencies
npm install

# start local development server
npm run dev

# build for production
npm run build

# deploy to Cloudflare Pages
npm run deploy
```

The public website is now remotely accessible, providing global access to real-time trip statistics and charging information over the internet.

### Mobile App (React Native)

```bash
# from repo root
cd ContinentalUSA-mobile

# install dependencies
npm install

# start development server
npm start

# run on iOS simulator
npm run ios

# run on Android device/emulator
npm run android
```

For production deployment:

```bash
# Build iOS
cd ContinentalUSA-mobile
npm run build:ios

# Build Android
cd ContinentalUSA-mobile
npm run build:android

# Deploy to stores (requires proper credentials)
npm run deploy:ios
npm run deploy:android
```

## Additional Components

### Requirements

- Xcode 15 (or later)  
- Swift 5.9 toolchain  
- Node.js (v16+) & npm  
- Cloudflare Wrangler CLI (`npm install -g @cloudflare/wrangler`)
- ROO CLI (install via `npm install -g @roo/cli` or [see documentation](https://github.com/roo/cli))
- Set `EDGE_HMAC_KEY` in your shell or CI environment

### iOS Client

1. Open the Swift Package in Xcode via `ios-client/Package.swift`.  
2. Select a simulator or device (targeting iOS 17+).  
3. Hit **Run** (⌘+R) to build and launch the app.

> Alternatively, from terminal:
>
> ```bash
> cd ios-client
> swift build
> # Note: `swift run` is not supported for iOS targets—use Xcode to launch.
> ```

### Edge Worker

```bash
# from repo root
cd edge-worker

# install dependencies
npm install

# run in dev mode on localhost:8787
wrangler dev

# build for production
wrangler build

# publish to Cloudflare (will read EDGE_HMAC_KEY from env)
wrangler publish
```

### Agents & Services

To start all backend services and data collection agents:

```bash
./scripts/start-agents.sh
```

## Architecture

The project consists of several key components:

1. **Public Website** - WLAN accessible interface for accessing trip data without internet connectivity
2. **React Native Mobile App** - Cross-platform companion app for trip statistics and charging station management
3. **iOS Native Client** - Swift-based application for primary trip management and vehicle telemetry
4. **Edge Worker** - Cloudflare Worker handling data aggregation and trip analytics
5. **Backend Agents** - Services for data collection, route optimization, and charging station availability

## Development

### Pre-deploy Checks

Before deploying any changes, run:

```bash
npm run pre-deploy
```

### Generate TypeScript Client

To update the TypeScript API client:

```bash
npm run codegen:ts
```

## Security

- All vehicle telemetry is collected in read-only mode
- Data is encrypted in transit using HMAC authentication
- No remote vehicle commands are supported
- Personal data remains on-device; only aggregated statistics are transmitted
- WLAN interface is only accessible on local network
- Mobile app uses secure storage for sensitive data

## License

See [LICENSE](./LICENSE) for details.

## Codex Agent

This repository includes a local "Codex" agent located in `codex-agent/`.
The agent helps automate component scaffolding, local builds, and repository
pushes. It runs without persistent background services and integrates with
existing CI/CD pipelines.

Run a task with:

```bash
npx ts-node codex-agent/run-task.ts <task>
```

Available tasks include `create`, `build`, and `push`. When a task fails, the
healing module attempts to auto-fix common issues and retry.
