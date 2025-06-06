# Deployment Instructions for The Wandering Whittle Map

## Current Deployment Status

The site has been successfully deployed to Cloudflare Pages.

## 1. Configure Environment Variables

Navigate to the Cloudflare Dashboard:
1. Go to https://dash.cloudflare.com
2. Select "Workers & Pages" from the sidebar
3. Select the "continentalusa-site" project
4. Click on "Settings" tab
5. Go to "Environment variables"
6. Add the following environment variables:

```
VITE_EDGE_WORKER_URL = https://thewanderingwhittle-edge.workers.dev
VITE_MAPBOX_TOKEN = pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA
VITE_TESSIE_API_TOKEN = bqfufwiCC5QeXIhlZ9I1eCYoF9XFd9xo
VITE_TESSIE_VIN = 5YJYGDEE5LF027324
VITE_OPENWEATHER_API_KEY = 15bff53e78e69788b02b407a2603ee43
VITE_WEBSOCKET_ENDPOINT = wss://thewanderingwhittle-edge.workers.dev/ws
VITE_API_BASE_URL = https://thewanderingwhittle-edge.workers.dev
VITE_ENABLE_STREAMING = true
VITE_USE_SIMULATED_DATA = false
```

7. Click "Save" to apply the environment variables
8. Trigger a new deployment by clicking "Redeploy" to apply the environment variables

## 2. Configure Custom Domain

1. Go to the "Custom domains" section under Settings
2. Click "Set up a custom domain"
3. Enter: thewanderingwhittle.com
4. Follow the verification steps
5. Wait for DNS propagation and SSL certificate issuance

## 3. Verify Map Functionality

1. Once the new deployment is complete, open the site
2. Check that the map loads correctly
3. Verify that vehicle markers and route are displayed
4. Test interaction with the map controls
5. Confirm that the weather data is loading

## Troubleshooting

If the map doesn't load correctly:
1. Check browser console for errors
2. Verify that all environment variables are set correctly
3. Ensure the MapBox token is valid
4. Check network requests to the edge worker API
