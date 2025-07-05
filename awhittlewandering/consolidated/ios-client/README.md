# 48 Continental USA iOS Client

Native iOS client application for the 48 Continental USA road trip tracking project. This app provides real-time access to the Tesla journey across all 48 contiguous states.

## Features

- **Real-time Vehicle Tracking**: Live tracking of Tesla vehicle position, speed, and status
- **Interactive Map**: Visual representation of the journey with route visualization
- **Trip Statistics**: Up-to-date statistics about the journey
- **Offline Support**: Local caching for continued functionality without network
- **Background Updates**: Periodic refreshes even when the app is in the background
- **Push Notifications**: Important journey milestones and status alerts
- **Apple Watch Integration**: Glanceable information on your wrist

## Technology Stack

- **SwiftUI**: Modern declarative UI framework
- **Swift Concurrency**: Async/await for network operations
- **MapKit**: Native mapping and location visualization
- **URLSession WebSockets**: Real-time data streaming
- **Core Data**: Persistent local storage and caching
- **Swift Package Manager**: Dependency management

## Development

### Prerequisites

- Xcode 15.0+
- iOS 17.0+ SDK
- macOS Ventura or newer
- Swift 5.9+

### Setup

1. Clone the repository
2. Open the project in Xcode:
   ```
   open ios-client/48Continental.xcworkspace
   ```
3. Create a `.env.default` file in the `fastlane` directory with required API keys

### Building & Running

1. Select a simulator or connected device
2. Press ⌘+R to build and run the app

### Testing

Run the test suite with:
```
swift test
```

Or run tests from within Xcode using ⌘+U

## Deployment

The app can be deployed to TestFlight or the App Store using Fastlane:

```
cd ios-client
fastlane beta
```

For App Store deployment:
```
fastlane release
```

## WebSocket Integration

The app connects to the same WebSocket endpoint as the web interface:

```swift
// Connect to WebSocket
let url = URL(string: "wss://continentalusa.workers.dev/tesla/vehicle/stream?id=\(vehicleId)")!
let task = URLSession.shared.webSocketTask(with: url)
task.resume()

// Receive messages
func receiveMessage() {
    task.receive { [weak self] result in
        switch result {
        case .success(let message):
            // Handle vehicle data updates
            self?.processMessage(message)
            self?.receiveMessage() // Continue receiving
        case .failure(let error):
            self?.handleConnectionError(error)
        }
    }
}
```

## Integration Points

- **Edge Worker**: Connects to the same WebSocket API as the web app
- **MCP Server**: Receives push notification tokens for alerts
- **Public Website**: Shares data models and API endpoints

## Documentation

For more detailed documentation, please see:
- [Vehicle Stream API](../docs/vehicle-stream-api.md)
- [WebSocket Implementation](../docs/websocket-implementation.md)
