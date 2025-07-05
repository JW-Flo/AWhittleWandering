# API Keys Explanation

## What Each Key Does

### 1. **OPENWEATHER_API_KEY** (MISSING - CAUSING DEPLOYMENT FAILURE)
- **What it's for**: Weather data for your road trip
- **Used by**: Edge worker to fetch current weather conditions
- **Get it free**: https://openweathermap.org/api
- **Sign up process**:
  1. Create free account at OpenWeatherMap
  2. Go to API keys section
  3. Copy your API key
  4. Add to GitHub secrets as `OPENWEATHER_API_KEY`

### 2. **TESSIE_API_TOKEN**
- **What it's for**: Access to Tesla vehicle data
- **Used by**: Edge worker to get vehicle status, location, battery level
- **Get it from**: https://tessie.com (requires Tesla vehicle)
- **Features**: Real-time vehicle telemetry, remote commands

### 3. **TESSIE_VIN**
- **What it's for**: Your Tesla's Vehicle Identification Number
- **Used by**: Identifies which specific Tesla to track
- **Example**: "5YJ3E1EA1JF000000"

### 4. **MAPBOX_TOKEN**
- **What it's for**: Interactive maps and route visualization
- **Used by**: Public site to display maps
- **Get it from**: https://www.mapbox.com
- **Features**: Map tiles, geocoding, route planning

### 5. **CF_API_TOKEN** & **CF_ACCOUNT_ID**
- **What it's for**: Deploying to Cloudflare
- **Used by**: GitHub Actions to deploy your app
- **Get from**: Cloudflare dashboard
- **Required for**: Cloudflare Workers and Pages deployment

### 6. **EDGE_HMAC_KEY**
- **What it's for**: Security - signs API requests
- **Used by**: Edge worker for secure communication
- **Generate with**: `openssl rand -hex 32`
- **Purpose**: Prevents unauthorized API access

### 7. **CONTINENTAL_API_KEY** (Optional)
- **What it's for**: AI features (if enabled)
- **Used by**: AI worker for advanced features
- **Note**: Can skip if not using AI features

## Frontend Variables (VITE_ prefix)

The same keys need to be duplicated with `VITE_` prefix for the frontend:
- `VITE_MAPBOX_TOKEN` = same as MAPBOX_TOKEN
- `VITE_OPENWEATHER_API_KEY` = same as OPENWEATHER_API_KEY
- `VITE_TESSIE_API_TOKEN` = same as TESSIE_API_TOKEN
- `VITE_TESSIE_VIN` = same as TESSIE_VIN

## Quick Setup for Missing Key

The deployment is failing because `OPENWEATHER_API_KEY` is missing. Here's how to fix it:

1. **Get a free OpenWeather API key**:
   ```
   1. Go to https://openweathermap.org/api
   2. Click "Sign Up" (free account)
   3. Verify email
   4. Go to "API keys" tab
   5. Copy your API key
   ```

2. **Add to GitHub**:
   ```
   1. Go to https://github.com/JW-Flo/ContinentalUSA/settings/secrets/actions
   2. Click "New repository secret"
   3. Name: OPENWEATHER_API_KEY
   4. Value: [paste your API key]
   5. Click "Add secret"
   ```

3. **Also add the VITE version**:
   ```
   1. Click "New repository secret" again
   2. Name: VITE_OPENWEATHER_API_KEY
   3. Value: [same API key]
   4. Click "Add secret"
   ```

That's the main one causing your deployment to fail!
