# Cloudflare Pages Environment Variables & Secrets

## Required Environment Variables

Set these via Cloudflare Dashboard or wrangler:

- `CF_PAGES_BRANCH`: Current branch (e.g., main)
- `PUBLIC_BASE_URL`: Public URL of the Pages site (e.g., `https://awhittlewandering.pages.dev`)
- `NODE_ENV`: production

## Feature Flags

- `FEATURE_MAPBOX`: Enable Mapbox integration
- `FEATURE_WEATHER`: Enable weather data
- `FEATURE_AI`: Enable AI features

## Secrets (Set via Wrangler)

Use these commands to set secrets for the awhittlewandering Pages project:

```bash
# API Keys
wrangler secret put TESSIE_API_KEY --project-name awhittlewandering
wrangler secret put MAPBOX_ACCESS_TOKEN --project-name awhittlewandering
wrangler secret put OPENWEATHER_API_KEY --project-name awhittlewandering

# Auth
wrangler secret put JWT_SECRET --project-name awhittlewandering

# Other
wrangler secret put TESLA_VIN --project-name awhittlewandering
```

## Verification

After setting secrets, verify with:

```bash
wrangler pages deployment list --project-name awhittlewandering
```
