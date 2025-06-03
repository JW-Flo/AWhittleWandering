# Real-Time Vehicle WebSocket Implementation

This directory contains the Cloudflare Worker implementation for real-time Tesla vehicle data streaming via WebSockets.

## Files Overview

- `vehicle-stream.ts` - The main WebSocket handler for vehicle data streaming
- `utils/tesla-client.ts` - Tesla API client with authentication and data fetching capabilities
- `utils/tesla-tokens.ts` - Token storage utilities for Tesla API credentials
- `index.ts` - Main Worker entry point with route handlers

## How It Works

The WebSocket implementation acts as a bridge between the Tesla API and the frontend applications:

1. When a client connects to `/tesla/vehicle/stream?id={vehicleId}`, the worker:
   - Verifies the vehicle ID is valid and accessible
   - Creates a WebSocket connection with the client
   - Begins polling the Tesla API for vehicle data (every 5 seconds)
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
   wrangler dev
   ```

2. Test WebSocket connection using a tool like [WebSocket King](https://websocketking.com/):
   - Connect to: `ws://localhost:8787/tesla/vehicle/stream?id=your_vehicle_id`

3. Or test directly from the frontend:
   ```
   cd 48Continental_Starter/public-site
   npm run dev
   ```

## Deployment

Deploy to Cloudflare using Wrangler:

```
cd edge-worker
wrangler publish
```

## Integration Points

- **Frontend**: Uses the `useVehicleData` React hook that connects to this WebSocket endpoint
- **iOS Client**: Can connect directly to the WebSocket endpoint using `URLSessionWebSocketTask`

## Error Handling

Common error scenarios handled:

1. **Connection failures**: The worker responds with appropriate HTTP status codes
2. **Authentication failures**: Automatically attempts to refresh tokens
3. **API rate limiting**: Respects Tesla's rate limits with timed polling
4. **Client disconnections**: Cleans up resources when clients disconnect

## Performance Notes

- Multiple clients requesting the same vehicle data will still result in only one request to the Tesla API
- Connection state is stored in memory, so Workers instance restarts will drop connections
- Polling frequency of 5 seconds balances real-time updates with API limitations

## Further Documentation

See the full API documentation in [docs/vehicle-stream-api.md](../../docs/vehicle-stream-api.md) for:
- Complete data structure
- Frontend integration examples
- iOS integration example
- Security considerations
