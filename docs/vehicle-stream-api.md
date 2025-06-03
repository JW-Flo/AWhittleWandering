# Tesla Vehicle WebSocket Stream API

This document describes the real-time vehicle data streaming system implemented for the 48 Continental USA project.

## Overview

The system provides real-time Tesla vehicle data via WebSockets, enabling live updates of vehicle location, battery status, climate control, and driving statistics for the dashboard and mobile applications.

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│             │      │                  │      │             │
│  Frontend   │◄────►│  Cloudflare      │◄────►│  Tesla API  │
│  Apps       │WebSkt│  Worker          │HTTP  │             │
│             │      │                  │      │             │
└─────────────┘      └──────────────────┘      └─────────────┘
```

1. **Cloudflare Worker**: Acts as a middleman between the Tesla API and the frontend apps. It:
   - Maintains persistent connections with the Tesla API
   - Handles token refresh when needed
   - Polls the Tesla API at a defined interval (currently 5 seconds)
   - Broadcasts vehicle data updates to all connected clients
   - Manages error handling and reconnection logic

2. **Frontend Applications**: Connect to the WebSocket endpoint and receive real-time updates, displaying them to users.

## API Endpoints

### WebSocket Vehicle Stream

**URL**: `/tesla/vehicle/stream?id={vehicleId}`

**Protocol**: WebSocket (wss:// or ws:// depending on environment)

**Query Parameters**:
- `id`: The Tesla vehicle ID to stream data for (required)

**Response Format**:
- Regular data updates: Full vehicle data object (see "Data Structure" below)
- Status messages: `{ "status": "reconnecting", "message": "..." }`
- Error messages: `{ "error": "error_code", "message": "Human readable error" }`

## Data Structure

The WebSocket sends JSON data with the following structure:

```json
{
  "id": "12345678901234567",
  "vehicle_id": 1234567890,
  "vin": "5YJSA11111111111",
  "display_name": "My Tesla",
  "state": "online",
  "drive_state": {
    "latitude": 37.12345,
    "longitude": -122.12345,
    "heading": 123,
    "speed": 35,
    "power": 10,
    "timestamp": 1622547731000
  },
  "charge_state": {
    "battery_level": 75,
    "battery_range": 250.5,
    "charging_state": "Charging",
    "charge_rate": 30,
    "minutes_to_full_charge": 120,
    "timestamp": 1622547731000
  },
  "climate_state": {
    "inside_temp": 72.5,
    "outside_temp": 85.0,
    "driver_temp_setting": 72.0,
    "passenger_temp_setting": 72.0,
    "is_climate_on": true,
    "timestamp": 1622547731000
  },
  "vehicle_state": {
    "locked": true,
    "sentry_mode": true,
    "software_update": {
      "status": "available",
      "version": "2023.12.1"
    },
    "odometer": 12345.6,
    "timestamp": 1622547731000
  }
}
```

## Frontend Integration

### React Hook Usage

The frontend application provides a custom React hook for easy integration:

```jsx
import { useVehicleData } from '../hooks/useVehicleData';

function VehicleDisplay() {
  const { 
    vehicleData,        // The latest vehicle data
    vehicleLoading,     // Loading state
    vehicleError,       // Error message if any
    connectionStatus,   // WebSocket connection status
    reconnect           // Function to force reconnection
  } = useVehicleData({ enableStreaming: true });

  // ...render vehicle data
}
```

### Connection Status Values

The connection status can be one of:
- `disconnected`: Not connected to the WebSocket
- `connecting`: Establishing connection
- `connected`: Successfully connected and receiving data
- `reconnecting`: Attempting to reconnect after disconnection

## iOS Integration

For iOS clients, connect to the WebSocket URL directly:

```swift
import Foundation

class VehicleStreamManager {
    private var webSocketTask: URLSessionWebSocketTask?
    private var session: URLSession?
    
    func connect(vehicleId: String) {
        let url = URL(string: "wss://your-worker-domain.com/tesla/vehicle/stream?id=\(vehicleId)")!
        session = URLSession(configuration: .default)
        webSocketTask = session?.webSocketTask(with: url)
        webSocketTask?.resume()
        
        receiveMessage()
    }
    
    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .data(let data):
                    // Handle binary data
                    break
                case .string(let text):
                    // Parse JSON and handle data
                    print("Received: \(text)")
                    break
                @unknown default:
                    break
                }
                // Continue receiving messages
                self?.receiveMessage()
            case .failure(let error):
                print("WebSocket error: \(error)")
            }
        }
    }
    
    func disconnect() {
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
    }
}
```

## Error Handling

The WebSocket endpoint handles the following error scenarios:

1. **Authentication failures**: Automatically attempts to refresh the Tesla API token
2. **Connection drops**: Implements exponential backoff reconnection
3. **API rate limits**: Enforces the 5-second minimum polling interval
4. **Invalid vehicle ID**: Returns appropriate error response

## Development and Testing

### Local Development

For local development, the WebSocket endpoint is available at:
```
ws://localhost:8787/tesla/vehicle/stream?id=your_vehicle_id
```

Use Cloudflare Wrangler CLI to run the worker locally:
```
cd edge-worker
npx wrangler dev
```

> **Important:** Always use `npx wrangler` commands rather than a global wrangler installation to ensure consistency across development and CI/CD environments.

For more detailed implementation information, see [WebSocket Implementation Guide](websocket-implementation.md).

### WebSocket Testing Tools

For testing WebSocket connections independent of the frontend:
- [WebSocket King](https://websocketking.com/)
- [Simple WebSocket Client](https://chrome.google.com/webstore/detail/simple-websocket-client/pfdhoblngboilpfeibdedpjgfnlcodoo) (Chrome Extension)

## Performance Considerations

- The default polling interval is 5 seconds, which balances real-time updates with Tesla API rate limits
- When multiple clients connect to stream the same vehicle, the Worker maintains only one connection to the Tesla API
- WebSocket connections have keep-alive mechanisms to prevent timeout disconnections

## Security Considerations

- Authentication with the Tesla API is handled server-side
- Tokens are stored securely in KV or D1 database
- No client-side token storage is required
- Only vehicle IDs that the authenticated account has access to can be streamed
