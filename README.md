# ContinentalUSA
App to manage 48 state continental drive 
A fully autonomous, 60-day EV-road-trip planner. • Collects read-only telemetry (state-of-charge, location, charging events) every 15 min while driving or charging. • Feeds data to an on-device algorithm that selects the next Supercharger/fallback L2 site using offline ABRP matrices. • Transmits high-level stats (leg complete, arrival %, charging cost) to the driver's personal Cloudflare Worker for post-trip analytics. **No remote commands** are issued (start-charge, unlock, climate, etc.). Data never shared with third parties; solely for personal trip logistics and energy budgeting.

## Build & Launch

### Requirements
- Xcode 15 (or later)  
- Swift 5.9 toolchain  
- Node.js (v16+) & npm  
- Cloudflare Wrangler CLI (`npm install -g @cloudflare/wrangler`)
- ROO CLI (install via `npm install -g @roo/cli` or see https://github.com/roo/cli)
- Set `EDGE_HMAC_KEY` in your shell or CI environment

### iOS Client
1. Open the Swift Package in Xcode via `ios-client/Package.swift`.  
2. Select a simulator or device (targeting iOS 17+).  
3. Hit **Run** (⌘+R) to build and launch the app.

> Alternatively, from terminal:
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