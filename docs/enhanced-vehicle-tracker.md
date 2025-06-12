# Enhanced Vehicle Tracking System

## Overview

The Enhanced Vehicle Tracking System is a mission-critical component of the 48 Continental USA project that provides robust vehicle telemetry tracking with comprehensive error handling, data validation, and reconnection logic. This system is designed to maintain real-time data consistency across all components while implementing fallback mechanisms.

## Architecture

The system consists of the following components:

1. **VehicleTracker**: Core class that manages vehicle telemetry data, implements data validation, buffering, and watchdog timers.
2. **Enhanced Vehicle Stream Handler**: Integrates the VehicleTracker with Cloudflare WebSockets for real-time data streaming.
3. **Logging and Monitoring**: Comprehensive logging and error tracking with structured data.
4. **Scheduled Cleanup**: Automated cleanup of inactive trackers to optimize resource usage.

## Key Features

- **Watchdog Timers**: Detect and respond to data stream interruptions
- **Data Validation**: Validate all GPS coordinates and telemetry data
- **Local Buffering**: Store recent telemetry data for reliability
- **Reconnection Logic**: Exponential backoff for connection issues
- **Error Handling**: Comprehensive error tracking with context
- **Resource Management**: Automatic cleanup of inactive resources
- **Connection Status Tracking**: Monitor connection status changes

## WebSocket Protocol

### Endpoints

- `wss://[edge-worker-domain]/tesla/vehicle/stream?id={vehicleId}`: Main WebSocket endpoint

### Communication Flow

1. **Client Connection**:
   - Client initiates WebSocket connection with vehicle ID
   - Server verifies vehicle access and establishes connection

2. **Data Streaming**:
   - Server polls for vehicle data at regular intervals (5 seconds)
   - Data is validated and processed through the VehicleTracker
   - Processed data is broadcast to all connected clients

3. **Commands**:
   - Clients can send commands via the WebSocket:
     - `{ "command": "refresh" }`: Force immediate data refresh
     - `{ "command": "ping" }`: Simple connection test

4. **Status Updates**:
   - Server sends connection status updates:
     - `{ "type": "connection_status", "status": "connected|reconnecting|error" }`
     - `{ "type": "error", "error": "error_code", "message": "Error description" }`

### Error Handling

The system implements comprehensive error handling:

- **Authentication Errors**: Automatically attempt token refresh
- **Network Errors**: Implement exponential backoff retry mechanism
- **Data Validation Errors**: Return last known valid data with error flags
- **Connection Issues**: Monitor and report connection status changes

### Example Messages

**Vehicle Data Update**:
```json
{
  "type": "vehicle_data",
  "vehicleId": "123456789",
  "timestamp": 1686591780000,
  "position": {
    "lat": 37.7749,
    "lng": -122.4194,
    "heading": 90,
    "speed": 65
  },
  "metrics": {
    "batteryLevel": 75,
    "batteryRange": 210.5,
    "power": 24,
    "temperature": 72,
    "isCharging": false
  },
  "status": {
    "online": true,
    "locked": true,
    "sentryMode": false
  }
}
```

**Error Message**:
```json
{
  "type": "error",
  "error": "authentication_failed",
  "message": "Failed to refresh authentication token"
}
```

## Implementation Details

### VehicleTracker Class

The `VehicleTracker` class implements:

- Position data validation (latitude/longitude bounds checking)
- Metrics validation (battery percentage, speed, etc.)
- Data buffering with configurable size limits
- Watchdog timer to detect stream interruptions
- Reconnection logic with exponential backoff
- Support for multiple concurrent clients

### Enhanced Vehicle Stream Handler

The handler:

- Manages WebSocket connections and lifecycle
- Handles authentication and token refresh
- Implements connection pooling and limiting
- Provides resource cleanup for inactive connections
- Broadcasts data to all connected clients for a vehicle

### Monitoring Integration

The system integrates with the monitoring subsystem to provide:

- Structured error logging with context
- Vehicle connection status tracking
- Performance metrics for data processing
- Resource utilization statistics

## Performance Considerations

- Maximum connections limit to prevent resource exhaustion
- Automatic cleanup of inactive trackers after 5 minutes
- Scheduled hourly cleanup task for system maintenance
- Data buffering limited to 100 entries per vehicle
- Connection pooling for multiple clients tracking the same vehicle

## Security Considerations

- Validate all vehicle IDs and request parameters
- Token-based authentication with auto-refresh
- Rate limiting through connection limits
- Input validation for all client messages
- Secure WebSocket connections (WSS)

## Fallback Mechanisms

In case of data interruptions, the system will:

1. Attempt to reconnect with exponential backoff
2. Notify clients of connection status changes
3. Provide last known good data if available
4. Report specific error conditions to clients

## Usage Instructions

### Connecting from Client Applications

```javascript
const connect = (vehicleId) => {
  const ws = new WebSocket(`wss://api.48continental.usa/tesla/vehicle/stream?id=${vehicleId}`);
  
  ws.onopen = () => {
    console.log('Connected to vehicle stream');
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'vehicle_data') {
      // Process vehicle data update
      updateVehicleOnMap(data.position);
      updateBatteryDisplay(data.metrics.batteryLevel);
    } else if (data.type === 'error') {
      // Handle error conditions
      console.error(`Vehicle stream error: ${data.message}`);
    } else if (data.type === 'connection_status') {
      // Update connection status indicator
      updateConnectionStatus(data.status);
    }
  };
  
  ws.onclose = () => {
    console.log('Vehicle stream disconnected, reconnecting...');
    setTimeout(() => connect(vehicleId), 3000);
  };
  
  ws.onerror = (error) => {
    console.error('Vehicle stream error:', error);
  };
  
  // Force a data refresh
  const requestRefresh = () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ command: 'refresh' }));
    }
  };
  
  // Return control functions
  return { 
    requestRefresh,
    close: () => ws.close()
  };
};
```

## Testing Instructions

1. **Connection Testing**:
   ```javascript
   const tester = connect('test_vehicle_id');
   ```

2. **Command Testing**:
   ```javascript
   tester.requestRefresh(); // Force data update
   ```

3. **Error Testing**:
   - Disconnect network and observe reconnection behavior
   - Provide invalid vehicle ID and observe error handling
   - Test with simulated authentication failures

## Deployment Notes

- Update wrangler.toml with scheduled trigger for hourly cleanup
- Ensure proper environment variables are set for authentication
- Test WebSocket connection limits before production deployment

## Monitoring

Monitor the following metrics:

- WebSocket connection counts (per vehicle and total)
- Data processing times
- Authentication failures and refreshes
- Watchdog timer events
- Reconnection attempts
- Buffer overflow events

## Future Improvements

- Implement message compression for bandwidth optimization
- Add support for binary message format for efficiency
- Implement persistent telemetry storage for extended history
- Add support for vehicle control commands
- Enhance data validation with predictive anomaly detection
