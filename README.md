 # A Whittle Wandering

Real-time Tesla road trip tracker for the 48 continental United States.

## Project Overview

A Whittle Wandering is a live road trip tracker that follows a 60-day journey across all 48 continental United States in a Tesla. The application provides real-time location tracking, vehicle telemetry, and trip statistics through an interactive map interface.

### Key Features

- Real-time vehicle location tracking via Tessie API
- Interactive Mapbox-powered map interface
- Trip statistics and state tracking
- Weather information integration
- Secure API gateway with Cloudflare Workers
- Responsive design for all devices

## Architecture

The application uses a modern, serverless architecture:

- **Frontend**: React/Vite application hosted on Cloudflare Pages
- **Backend**: Cloudflare Workers providing secure API access
- **Data Sources**: 
  - Tessie API for Tesla vehicle telemetry
  - OpenWeather API for weather information
  - Mapbox for mapping and visualization
- **Caching**: Cloudflare KV for caching API responses
- **Deployment**: GitHub Actions CI/CD pipeline

## Deployment

### Prerequisites

- Node.js 20+ installed
- Cloudflare account with Workers and Pages enabled
- Tessie API access (for Tesla integration)
- Mapbox API token
- OpenWeather API key

### Environment Variables

Create a `.env` file at the root of the project with the following variables:

```
# Cloudflare credentials
CF_API_TOKEN=your_cloudflare_api_token_here
CF_ACCOUNT_ID=your_cloudflare_account_id_here

# Tesla vehicle telemetry via Tessie API
TESSIE_API_TOKEN=your_tessie_api_token_here
TESSIE_VIN=your_tesla_vehicle_id_here

# Mapbox for mapping functionality
MAPBOX_TOKEN=your_mapbox_token_here
MAPBOX_API_TOKEN=your_mapbox_private_token_here

# Edge HMAC key for API security
EDGE_HMAC_KEY=your_edge_hmac_security_key_here

# OpenWeather API for weather data
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### Deployment Methods

#### Option 1: Using the Deployment Script

The easiest way to deploy the application is using the provided deployment script:

```bash
# Make the script executable (if not already)
chmod +x scripts/deploy-website.sh

# Run the deployment script
./scripts/deploy-website.sh
```

This script will:
1. Validate environment variables
2. Install dependencies
3. Build the frontend
4. Deploy the site worker (frontend)
5. Deploy the API worker (backend)

#### Option 2: GitHub Actions Deployment

The project includes a GitHub Actions workflow that automatically deploys the application when changes are pushed to the main branch.

To use GitHub Actions deployment:

1. Add the required secrets to your GitHub repository:
   - `CF_API_TOKEN`
   - `CF_ACCOUNT_ID`
   - `MAPBOX_TOKEN`
   - `MAPBOX_API_TOKEN`
   - `TESSIE_API_TOKEN`
   - `TESSIE_VIN`
   - `EDGE_HMAC_KEY`
   - `OPENWEATHER_API_KEY`

2. Push changes to the main branch to trigger the deployment workflow.

#### Option 3: Manual Deployment

You can also deploy the application manually using Wrangler:

```bash
# Change directory to the project folder
cd awhittlewandering

# Install dependencies
npm install

# Build the frontend
npm run build:frontend

# Deploy the site worker
npx wrangler deploy --config wrangler-site.toml

# Deploy the API worker
npx wrangler deploy --config wrangler.toml
```

### Verifying Deployment

After deployment, you can verify that the application is working correctly by:

1. Visiting the website (https://awhittlewandering.com)
2. Checking the API health endpoint (https://api.awhittlewandering.com/health)
3. Verifying that vehicle data is loading on the map

## Development

### Local Development

```bash
# Install dependencies
cd awhittlewandering
npm install

# Start the frontend development server
npm run dev
```

### Code Structure

- `awhittlewandering/packages/frontend/`: React frontend application
- `awhittlewandering/workers/`: Cloudflare Workers for API and site hosting
- `awhittlewandering/packages/shared/`: Shared types and utilities

## Troubleshooting

### Common Issues

1. **MapBox Token Issues**: If the map fails to load, verify that your Mapbox token is correctly set in both environment variables and wrangler configuration files.

2. **Tessie API Connection**: If vehicle data is not updating, check Tessie API connectivity and ensure the VIN is correct.

3. **Deployment Failures**: If deployment fails, check the Cloudflare API token permissions and account ID.

4. **Type Errors**: If you encounter TypeScript errors, run `npm run check-types` to identify the specific issues.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
