# Setup Guide

## Prerequisites

- Node.js >= 22.16.0 (LTS)
- npm >= 10.0.0
- Wrangler CLI >= 4.19.0

## Quick Start with Pre-installed Tools

If you have the recommended tools pre-installed:

```bash
npm install
npm run dev
```

## Automated Setup

Run the automated setup script to check and install all requirements:

```bash
npm run setup
```

This script will:
- Check Node.js and npm versions
- Install Wrangler CLI if needed
- Install project dependencies
- Set up environment files

## Manual Installation

1. Install Node.js:
   ```bash
   # Using nvm (recommended)
   nvm install 22
   nvm use 22
   ```

2. Install Wrangler globally:
   ```bash
   npm install -g wrangler@4.19.1
   ```

3. Install project dependencies:
   ```bash
   npm install
   ```

## Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables in `.env`. Required variables:

   - `VITE_MAPBOX_TOKEN`: Your Mapbox access token
   - `CF_ACCOUNT_ID`: Your Cloudflare account ID
   - `CF_API_TOKEN`: Your Cloudflare API token with Workers permissions

   Optional variables:
   - `VITE_USE_REAL_DATA`: Set to 'true' to use real data instead of mocks
   - `VITE_DEBUG`: Set to 'true' to enable debug logging
   - `VITE_LOG_LEVEL`: Set logging level (debug, info, warn, error)

3. For local development, you can get these values by:
   - Mapbox token: Visit https://account.mapbox.com/access-tokens/
   - Cloudflare credentials: Visit https://dash.cloudflare.com/profile/api-tokens

## Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests with real data
npm run test:real-data

# Deploy
npm run deploy
```

## Troubleshooting

### Common Issues

1. **Wrangler Authentication Issues**
   ```bash
   wrangler login
   ```

2. **Node Version Mismatch**
   ```bash
   nvm use 18
   ```

3. **Port Already in Use**
   ```bash
   kill -9 $(lsof -ti:3000)
   ```

## Version Requirements

See `package.json` for detailed dependency versions. Key requirements:

- React >= 18.2.0
- Vite >= 6.3.5
- Vitest >= 3.2.1
- Mapbox GL JS >= 3.4.0

## Notes

- The project uses ESM modules (`"type": "module"` in package.json)
- Wrangler is used for Cloudflare Workers deployment
- Tests use Vitest with JSDOM for browser environment simulation
