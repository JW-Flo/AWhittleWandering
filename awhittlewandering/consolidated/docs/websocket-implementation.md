# Real-Time Vehicle WebSocket Implementation

This document describes the Cloudflare Worker implementation for real-time Tesla vehicle data streaming via WebSockets for The Wandering Whittle project.

## Files Overview

- `vehicle-stream.ts` - The main WebSocket handler for vehicle data streaming
- `utils/tessie-client.ts` - Tessie API client with authentication and data fetching capabilities 
- `utils/tessie-tokens.ts` - Token storage utilities for Tessie API credentials
- `index.ts` - Main Worker entry point with route handlers

## How It Works

The WebSocket implementation acts as a bridge between the Tesla API and the frontend applications:

1. When a client connects to `/tessie/vehicle/stream?vin={vin}`, the worker:
   - Verifies the VIN is valid and accessible
   - Creates a WebSocket connection with the client
   - Begins polling the Tessie API for vehicle data (every 5 seconds)
   - Streams updates to the connected client

2. The worker handles:
   - Authentication refreshing when tokens expire
   - Reconnection logic
   - Error states and reporting
   - Clean shutdown of connections

## Testing Locally

1. Start the worker locally:
   ```
   cd edge-worker
   npx wrangler dev
   ```
   > **Note:** Always use `npx wrangler` instead of a global wrangler installation.

2. Test WebSocket connection using a tool like [WebSocket King](https://websocketking.com/):
   - Connect to: `ws://localhost:8787/tessie/vehicle/stream?vin=your_vehicle_vin`

3. Or test directly from the frontend:
   ```
   cd 48Continental_Starter/public-site
   bun run dev
   ```

## Deployment

Deploy to Cloudflare using Wrangler:

```
cd edge-worker
npx wrangler deploy
```

> **Important:** All deployment commands should use `npx wrangler` to ensure consistency across environments.

## Integration Points

- **Frontend**: Uses the `useVehicleData` React hook that connects to this WebSocket endpoint
- **iOS Client**: Can connect directly to the WebSocket endpoint using `URLSession.shared.webSocketTask(with:)`

## Error Handling

Common error scenarios handled:

1. **Connection failures**: The worker responds with appropriate HTTP status codes
2. **Authentication failures**: Automatically reconnects using the provided Tessie API token
3. **API rate limiting**: Respects Tessie's rate limits with timed polling
4. **Client disconnections**: Cleans up resources when clients disconnect

## Performance Notes

- Multiple clients requesting the same vehicle data will still result in only one request to the Tesla API
- Connection state is stored in memory, so Workers instance restarts will drop connections
- Polling frequency of 5 seconds balances real-time updates with API limitations

## Further Documentation

See the full API documentation in [vehicle-stream-api.md](vehicle-stream-api.md) for:
- Complete data structure
- Frontend integration examples
- iOS integration example
- Security considerations
