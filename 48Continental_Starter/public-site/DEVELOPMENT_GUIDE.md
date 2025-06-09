# The Wandering Whittle Development Guide

This guide provides instructions for setting up, developing, and deploying the The Wandering Whittle website.

## Project Overview

The The Wandering Whittle project tracks a 60-day Tesla road trip through all 48 contiguous U.S. states, with real-time vehicle telemetry, weather data, and interactive mapping. The project consists of:

- **Edge Worker**: A Cloudflare Worker that provides APIs for vehicle data, trip statistics, and other backend services
- **Public Site**: A React-based frontend that displays the trip information with interactive maps and dashboards

## Prerequisites

- Node.js v24.1.0 or higher
- npm or yarn
- Cloudflare account (for deployment)
- API keys:
  - Tessie API token (for Tesla vehicle data)
  - Mapbox token (for mapping functionality)
  - OpenWeather API key (for weather data)

## Environment Setup

The project includes scripts to set up your development environment:

```bash
# Set up environment variables for both edge worker and public site
node scripts/setup-env.cjs

# Start both edge worker and public site for local development
node scripts/start-local-dev.cjs
```

### Environment Variables

Required environment variables for full functionality:

| Variable | Purpose | Required |
|----------|---------|----------|
| TESSIE_API_TOKEN | Access Tesla vehicle data | Yes |
| TESSIE_VIN | Vehicle identification number | Yes |
| MAPBOX_TOKEN | Interactive mapping | Yes |
| OPENWEATHER_API_KEY | Weather data | Yes |
| EDGE_HMAC_KEY | Security key for API authentication | Auto-generated |

These can be set in your system environment, or in the following files:
- Edge worker: `edge-worker/.dev.vars`
- Public site: `WanderingWhittle_Starter/public-site/.env.local`

## Local Development

The project includes a unified development environment that runs both the edge worker and public site:

```bash
node scripts/start-local-dev.cjs
```

This script:
1. Sets up environment variables
2. Starts the Edge Worker with Wrangler
3. Starts the Public Site development server
4. Connects the services together
5. Provides an interactive CLI for controlling the development environment

### Development CLI Commands

While the development environment is running, you can use these commands:

- `help` - Show available commands
- `restart` - Restart both services
- `validate` - Test connectivity between services
- `clear` - Clear the console
- `exit` - Shut down and exit

## Manual Development

If you prefer to run the services separately:

### Edge Worker

```bash
cd edge-worker
npm install
npx wrangler dev
```

### Public Site

```bash
cd WanderingWhittle_Starter/public-site
npm install
npm run dev
```

## Testing

The project includes both unit tests and integration tests with real data simulation:

```bash
# Run unit tests
cd WanderingWhittle_Starter/public-site
npm test

# Run tests with real data simulation
cd WanderingWhittle_Starter/public-site
npm run test:realdata
```

## Production Deployment

The project uses GitHub Actions for automated deployment to Cloudflare:

1. Edge Worker is deployed as a Cloudflare Worker
2. Public Site is deployed to Cloudflare Pages

### Manual Deployment

If you need to deploy manually:

#### Edge Worker

```bash
cd edge-worker
npm ci
npx wrangler deploy
```

#### Public Site

```bash
cd WanderingWhittle_Starter/public-site
npm ci
npm run build
npx wrangler pages deploy dist --project-name=continentalusa-site
```

## Project Structure

```
.
├── edge-worker/                # Cloudflare Worker backend
│   ├── src/                    # Source code
│   │   ├── index.ts            # Main entry point
│   │   ├── tessie-client.ts    # Tesla API integration
│   │   └── ...                 # Other modules
│   ├── .dev.vars               # Local environment variables
│   └── wrangler.toml           # Wrangler configuration
│
├── WanderingWhittle_Starter/
│   └── public-site/            # React frontend
│       ├── src/                # Source code
│       │   ├── components/     # UI components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── api/            # API clients
│       │   └── ...             # Other frontend code
│       ├── .env.local          # Local environment variables
│       └── vite.config.js      # Vite configuration
│
├── scripts/                    # Development and deployment scripts
│   ├── setup-env.cjs           # Environment setup script
│   └── start-local-dev.cjs     # Local development runner
│
└── .github/workflows/          # GitHub Actions workflows
    └── deploy-all-final.yml    # Production deployment workflow
```

## Troubleshooting

### API Connection Issues

If you're seeing API errors:

1. Check that all required API keys are set in your environment
2. Verify the edge worker is running and accessible
3. Check the console logs for specific error messages

### Deployment Issues

If deployment fails:

1. Verify Cloudflare API tokens are correctly set up
2. Check GitHub Actions logs for detailed error information
3. Ensure KV namespaces are correctly configured

## Contributing

1. Follow the code style of the existing project
2. Run tests before submitting pull requests
3. Update documentation for any new features
