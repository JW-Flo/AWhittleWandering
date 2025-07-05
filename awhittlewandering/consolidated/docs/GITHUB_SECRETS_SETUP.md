# GitHub Secrets Setup Guide

This guide explains how to configure the required GitHub secrets for deploying the ContinentalUSA project to Cloudflare.

## Prerequisites

- GitHub repository access with admin permissions
- Cloudflare account with API access
- API keys for third-party services (Tessie, OpenWeather, Mapbox)

## Required Secrets

### Cloudflare Secrets

1. **CF_API_TOKEN**
   - Description: Cloudflare API token for deployment
   - How to get it:
     1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
     2. Click "Create Token"
     3. Use the "Edit Cloudflare Workers" template
     4. Add permissions for "Cloudflare Pages:Edit"
     5. Copy the generated token

2. **CF_ACCOUNT_ID**
   - Description: Your Cloudflare account ID
   - How to get it:
     1. Go to any domain in your Cloudflare dashboard
     2. Look in the right sidebar for "Account ID"
     3. Copy the ID

### Tessie API Secrets

3. **TESSIE_API_TOKEN**
   - Description: Tessie API token for Tesla vehicle access
   - How to get it:
     1. Sign up at [Tessie.com](https://tessie.com)
     2. Go to Settings → API
     3. Generate a new API token
     4. Copy the token

4. **TESSIE_VIN**
   - Description: Your Tesla vehicle's VIN
   - How to get it:
     1. In Tessie dashboard, select your vehicle
     2. Copy the VIN from vehicle details

### Third-Party API Keys

5. **OPENWEATHER_API_KEY**
   - Description: OpenWeatherMap API key for weather data
   - How to get it:
     1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
     2. Go to API keys section
     3. Generate a new API key
     4. Copy the key

6. **MAPBOX_TOKEN**
   - Description: Mapbox access token for maps
   - How to get it:
     1. Sign up at [Mapbox](https://www.mapbox.com)
     2. Go to Account → Tokens
     3. Create a new token or use default public token
     4. Copy the token

### Security Keys

7. **EDGE_HMAC_KEY**
   - Description: HMAC key for edge worker security
   - How to generate:
     ```bash
     openssl rand -hex 32
     ```
   - Or use any secure random string generator

### Frontend Environment Variables

These are the same values as above but prefixed with `VITE_` for the frontend build:

8. **VITE_MAPBOX_TOKEN** - Same as MAPBOX_TOKEN
9. **VITE_OPENWEATHER_API_KEY** - Same as OPENWEATHER_API_KEY
10. **VITE_TESSIE_API_TOKEN** - Same as TESSIE_API_TOKEN
11. **VITE_TESSIE_VIN** - Same as TESSIE_VIN

### Optional Secrets

12. **CONTINENTAL_API_KEY** - Required only if using the AI worker features

## How to Add Secrets to GitHub

1. Navigate to your repository on GitHub
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter the secret name (e.g., `CF_API_TOKEN`)
6. Enter the secret value
7. Click **Add secret**
8. Repeat for all required secrets

## Verifying Secrets

Run the verification script to check if all secrets are configured:

```bash
./scripts/verify-github-secrets.sh
```

This script requires GitHub CLI (`gh`) to be installed and authenticated.

## Local Development

For local development, create these files:

### Edge Worker (.dev.vars)
```bash
TESSIE_API_TOKEN=your_tessie_token
OPENWEATHER_API_KEY=your_openweather_key
MAPBOX_TOKEN=your_mapbox_token
EDGE_HMAC_KEY=your_hmac_key
```

### Public Site (.env.local)
```bash
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_OPENWEATHER_API_KEY=your_openweather_key
VITE_TESSIE_API_TOKEN=your_tessie_token
VITE_TESSIE_VIN=your_tesla_vin
VITE_EDGE_WORKER_URL=https://thewanderingwhittle-edge.workers.dev
```

## Troubleshooting

### "Failed to upload secrets" Error
- Ensure the secret name matches exactly (case-sensitive)
- Verify the secret value doesn't contain invalid characters
- Check that you have the correct permissions in the repository

### "Wrangler requires Node.js v20.0.0" Error
- The workflows have been updated to use Node.js 20
- If running locally, update Node.js: `nvm install 20 && nvm use 20`

### "Value for secret not found in environment" Error
- The secret is missing from GitHub repository settings
- Add the missing secret following the steps above

## Security Best Practices

1. **Never commit secrets to the repository**
2. **Rotate API keys regularly**
3. **Use different keys for production and development**
4. **Limit API key permissions to minimum required**
5. **Monitor API key usage for anomalies**

## Next Steps

After configuring all secrets:

1. Push changes to trigger the workflow
2. Monitor the Actions tab for deployment status
3. Check deployment URLs:
   - Edge Worker: https://thewanderingwhittle-edge.workers.dev
   - Public Site: https://continentalusa-site.pages.dev

For more information, see the [deployment documentation](./DEPLOYMENT_STRATEGY.md).
