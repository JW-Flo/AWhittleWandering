# Vehicle Telemetry Service - 48 Continental USA Project

## Overview

The Vehicle Telemetry Service is a critical component of the 48 Continental USA project, responsible for monitoring, processing, and distributing real-time telemetry data from the Tesla vehicle during its 60-day journey across all 48 contiguous U.S. states.

This module provides robust handling of vehicle telemetry with features including:

- Real-time data polling
- Offline buffering
- Automatic reconnection
- Watchdog monitoring
- Comprehensive error handling
- Data validation
- Multi-system synchronization

## Architecture

The telemetry service follows a modular architecture that interacts with several other system components:

```
                 ┌───────────────────┐
                 │                   │
                 │  Onboard Vehicle  │
                 │     Tracker       │
                 │                   │
                 └─────────┬─────────┘
                           │
                           ▼
┌───────────────────┐    ┌─────────────────────┐    ┌───────────────────┐
│                   │    │                     │    │                   │
│       MCP         │◄───┤  VehicleTelemetry   │───►│  Edge Worker      │
│      Server       │    │      Service        │    │  Infrastructure   │
│                   │    │                     │    │                   │
└───────────────────┘    └─────────────────────┘    └───────────────────┘
                                    │
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │                     │
                         │   Public Website    │
                         │                     │
                         └─────────────────────┘
```

## Usage

### Basic Implementation

```javascript
import { createVehicleTelemetryService } from './shared/services/VehicleTelemetryService';

// Create and configure the telemetry service
const telemetryService = createVehicleTelemetryService({
  vehicleId: 'TESLA-MODEL-Y-1',
  mcpEndpoint: 'https://mcp.48continental.com/api',
  edgeEndpoint: 'https://edge.48continental.com/api',
  pollInterval: 5000,
  watchdogTimeout: 30000,
  enableOfflineMode: true
});

// Start monitoring telemetry
await telemetryService.start();

// Listen for telemetry updates
telemetryService.on('telemetryUpdate', (telemetry) => {
  console.log('New telemetry received:', telemetry);
  
  // Update UI, store data, etc.
  updateMap(telemetry.position);
  updateBatteryDisplay(telemetry.metrics.batteryLevel);
  updateSpeedometer(telemetry.metrics.speed);
});

// Listen for state changes
telemetryService.on('stateChanged', ({ oldState, newState }) => {
  console.log(`Telemetry service state changed from ${oldState} to ${newState}`);
  
  // Update UI to reflect connection state
  updateConnectionStatus(newState);
});

// Force an immediate telemetry update
const latestTelemetry = await telemetryService.forceUpdate();

// Stop the service when done
await telemetryService.stop();
```

### Advanced Configuration

The telemetry service accepts a comprehensive configuration object:

```javascript
const config = {
  // Required parameters
  vehicleId: 'TESLA-MODEL-Y-1',
  mcpEndpoint: 'https://mcp.48continental.com/api',
  
  // Optional parameters with defaults
  edgeEndpoint: 'https://edge.48continental.com/api',
  pollInterval: 5000,        // ms between telemetry polls
  watchdogTimeout: 30000,    // ms before watchdog timeout
  maxRetries: 5,             // max retry attempts for failed operations
  retryDelay: 2000,          // ms between retry attempts
  bufferSize: 1000,          // max size of telemetry buffer
  enableOfflineMode: true,   // whether to enable offline buffering
};
```

### Event Handling

The telemetry service emits several events:

| Event | Description | Payload |
|-------|-------------|---------|
| `started` | Service has started successfully | - |
| `stopped` | Service has been stopped | - |
| `telemetryUpdate` | New telemetry data received | `TelemetryPacket` |
| `stateChanged` | Service state has changed | `{ oldState, newState, timestamp }` |
| `watchdogTimeout` | No data received within timeout | `{ vehicleId, lastTelemetryTimestamp, currentTimestamp }` |
| `connectionIssue` | Connection problem detected | `{ vehicleId, timestamp, lastTelemetryTimestamp }` |
| `reconnected` | Successfully reconnected after issue | `{ vehicleId, timestamp, bufferSize }` |
| `error` | General error occurred | `{ type, error, vehicleId, timestamp }` |

Example event listeners:

```javascript
// Listen for telemetry updates
telemetryService.on('telemetryUpdate', (telemetry) => {
  // Process new telemetry data
});

// Listen for connection issues
telemetryService.on('connectionIssue', ({ vehicleId, timestamp }) => {
  // Handle connection problems
  showOfflineIndicator();
  logConnectionIssue(vehicleId, timestamp);
});

// Listen for successful reconnection
telemetryService.on('reconnected', ({ vehicleId, bufferSize }) => {
  // Handle reconnection
  hideOfflineIndicator();
  logReconnectionEvent(vehicleId, bufferSize);
});

// Handle watchdog timeouts
telemetryService.on('watchdogTimeout', ({ vehicleId, lastTelemetryTimestamp }) => {
  // Handle data interruption
  triggerWatchdogAlert(vehicleId, lastTelemetryTimestamp);
});
```

## Telemetry Data Format

The telemetry service processes and emits data in the following format:

```typescript
interface TelemetryPacket {
  vehicleId: string;                 // Unique vehicle identifier
  timestamp: number;                 // Unix timestamp in milliseconds
  position: {
    lat: number;                     // Latitude coordinate
    lng: number;                     // Longitude coordinate
    accuracy?: number;               // Position accuracy in meters (if available)
  };
  metrics: {
    batteryLevel: number;            // Battery level percentage (0-100)
    speed: number;                   // Speed in mph
    temperature: number;             // Cabin temperature in °F
  };
}
```

## Error Handling

The telemetry service implements robust error handling with:

1. **Automatic Retries**: Failed operations are retried with exponential backoff
2. **Offline Mode**: Switches to offline buffering when connectivity is lost
3. **Watchdog Timer**: Monitors for data interruptions
4. **Comprehensive Logging**: All errors and warnings are logged with context
5. **Graceful Degradation**: Continues operation when possible, even with partial failures

## Service States

The telemetry service can be in one of the following states:

| State | Description |
|-------|-------------|
| `disconnected` | Service is inactive |
| `connecting` | Service is attempting to connect |
| `connected` | Service is active and receiving data |
| `offline` | Service is in offline buffering mode |
| `error` | Service encountered a critical error |

## Dependencies

This service relies on the following modules:

- `logger.js` - Structured logging utility
- `validators.js` - Telemetry data validation
- `mcpQueue.js` - MCP operation queue with retry logic

## Testing

Comprehensive tests are available in `/tests/VehicleTelemetryService.test.js` and can be run with:

```bash
npm test tests/VehicleTelemetryService.test.js
```

## Performance Considerations

The telemetry service is designed for optimal performance with:

1. **Minimal Memory Footprint**: Limited buffer size and efficient data structures
2. **Throttled Network Operations**: Controlled polling interval and batch processing
3. **Efficient Data Processing**: Validation and processing optimized for real-time data
4. **Resource Cleanup**: Proper cleanup of timers and event listeners

## Security Considerations

The implementation includes several security measures:

1. **Input Validation**: All telemetry data is validated before processing
2. **Rate Limiting**: Controlled polling to prevent API abuse
3. **Error Masking**: Sensitive details are redacted in logs
4. **Secure Communication**: Built with HTTPS-only API assumptions

## Integration Notes

When integrating this service with other components:

1. Ensure MCP server implements the expected batch operation endpoint
2. Configure appropriate timeouts based on network conditions
3. Add appropriate event handlers for all service states
4. Implement UI feedback for connection state changes

## Maintainer

For questions about this module, contact the 48 Continental USA project team.
