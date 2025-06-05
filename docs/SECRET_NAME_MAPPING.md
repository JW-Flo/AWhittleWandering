# GitHub Secret Name Mapping

Based on your feedback, here's the mapping between what the workflows expect and what you have in GitHub Secrets:

## Your Current GitHub Secrets

| Secret Name in GitHub | Used As | Description |
|----------------------|---------|-------------|
| `OPEN_WEATHER_API_KEY` | `OPENWEATHER_API_KEY` | Weather API key (note the underscore) |
| `MAP_API_TOKEN` | `MAPBOX_TOKEN` | Mapbox API token |
| `TESSIE_API_TOKEN` | `TESSIE_API_TOKEN` | Tessie API token (same name) |
| `TESSIE_VIN` | `TESSIE_VIN` | Tesla VIN (same name) |
| `VITE_OPENWEATHER_API_KEY` | `VITE_OPENWEATHER_API_KEY` | Frontend weather API key |
| `CF_API_TOKEN` | `CF_API_TOKEN` | Cloudflare API token |
| `CF_ACCOUNT_ID` | `CF_ACCOUNT_ID` | Cloudflare account ID |
| `EDGE_HMAC_KEY` | `EDGE_HMAC_KEY` | HMAC security key |

## Workflow Updates Made

I've updated all workflows to use your actual secret names:

1. **deploy-all-fixed.yml** ✅
   - Changed `OPENWEATHER_API_KEY` → `OPEN_WEATHER_API_KEY`
   - Changed `MAPBOX_TOKEN` → `MAP_API_TOKEN`
   - Changed `VITE_MAPBOX_TOKEN` → `MAP_API_TOKEN`
   - Changed `VITE_TESSIE_API_TOKEN` → `TESSIE_API_TOKEN`

2. **deploy-all.yml** ✅
   - Same changes as above

3. **deploy.yml** ✅
   - Same changes as above

## Still Missing (Optional)

- `CONTINENTAL_API_KEY` - Only needed if using AI worker features

## Next Steps

1. The workflows should now work with your existing secrets
2. Push the changes to trigger the deployment
3. Monitor the Actions tab: https://github.com/JW-Flo/ContinentalUSA/actions

The main issue was the mismatch between secret names. Your secrets were there all along, just with slightly different names!
