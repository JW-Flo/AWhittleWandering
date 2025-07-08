# API Manager

Resilient API access system for the 48 Continental project. This module provides circuit breaking, caching, rate limiting, and fallback strategies to ensure uninterrupted access to external APIs even during temporary failures.

## Features

- **Circuit Breaking**: Automatically detects failing APIs and prevents cascading failures
- **Intelligent Caching**: Reduces API dependency with configurable TTL-based caching
- **Retry Logic**: Exponential backoff for transient failures
- **Credential Integration**: Seamless integration with Credential Manager for secure API authentication
- **State Monitoring**: Tracks API health across the system
- **Request Timeouts**: Configurable timeouts to prevent long-running requests

## Installation

```bash
cd shared/api-manager
bun install
bun run build
```

## Usage

### Basic Usage with Tesla API

```typescript
import { TeslaApiClient } from '@48continental/api-manager';
import { CredentialManager, OnePasswordSource, EnvSource } from '@48continental/credential-manager';

// Initialize credential manager
const credentialManager = new CredentialManager([
  new OnePasswordSource(
    process.env.ONEPASSWORD_CONNECT_URL!, 
    process.env.ONEPASSWORD_VAULT_ID!, 
    process.env.ONEPASSWORD_CONNECT_TOKEN!
  ),
  new EnvSource()
]);

// Create Tesla API client with credential manager
const teslaClient = new TeslaApiClient(credentialManager);

// Get vehicle data with resilience
async function getVehicleLocation() {
  try {
    // Circuit breaking, caching, and retries handled automatically
    const vehicles = await teslaClient.getVehicles();
    if (vehicles.length === 0) {
      return null;
    }
    
    const vehicleData = await teslaClient.getVehicleData(vehicles[0].id);
    return {
      latitude: vehicleData.drive_state.latitude,
      longitude: vehicleData.drive_state.longitude
    };
  } catch (error) {
    console.error('Failed to get vehicle location:', error);
    return null;
  }
}
```

### Creating a Custom API Client

```typescript
import { ApiManager, ApiClient } from '@48continental/api-manager';
import { CredentialManager } from '@48continental/credential-manager';

class WeatherApiClient {
  private client: ApiClient;
  private apiManager: ApiManager;
  private apiName = 'weather';

  constructor(
    credentialManager: CredentialManager,
    private baseUrl = 'https://api.weather.gov'
  ) {
    this.apiManager = new ApiManager(credentialManager, {
      failureThreshold: 2,
      resetTimeout: 30000,
      halfOpenSuccess: 1
    });
    
    this.client = new ApiClient({
      baseUrl: this.baseUrl,
      timeout: 10000
    });
  }

  async getPointForecast(lat: number, lon: number) {
    return this.apiManager.executeRequest(
      this.apiName,
      this.client,
      `/points/${lat},${lon}`,
      {
        cache: true,
        cacheTtl: 3600 // 1 hour cache for location data
      }
    );
  }

  async getForecast(forecastUrl: string) {
    return this.apiManager.executeRequest(
      this.apiName,
      this.client,
      forecastUrl,
      {
        cache: true,
        cacheTtl: 1800 // 30 minute cache for forecast
      }
    );
  }
}
```

## Circuit Breaker Pattern

The API Manager implements the Circuit Breaker pattern to prevent cascading failures:

1. **Closed State**: Normal operation, requests pass through
2. **Open State**: After multiple failures, requests are blocked to allow the API to recover
3. **Half-Open State**: After a cooling period, allows a test request to check if the API has recovered

```
Closed → (failures > threshold) → Open → (cooling period) → Half-Open → (success) → Closed
                                   ↑                           |
                                   └───────(failure)───────────┘
```

## Caching Strategy

The caching system uses a multi-tiered approach:

1. **In-Memory Cache**: Fast access with configurable TTL
2. **Size Management**: LRU (Least Recently Used) eviction policy
3. **Method-Based Caching**: Only GET requests are cached by default
4. **Per-Request Control**: Can enable/disable caching for specific requests

## Integrating with MCP Orchestrator

```typescript
import { ApiManager } from '@48continental/api-manager';
import { CredentialManager } from '@48continental/credential-manager';
import { MCPOrchestrator } from './mcp-orchestrator';

async function setupMCP() {
  const credentialManager = new CredentialManager([/* sources */]);
  const apiManager = new ApiManager(credentialManager);
  
  // Initialize MCP with API manager
  const mcp = new MCPOrchestrator({
    apiManager,
    // other config
  });

  // Register the API manager as an agent
  mcp.registerAgent('api-manager', {
    getApiState: (apiName) => {
      return apiManager.getApiState(apiName);
    },
    clearCache: () => {
      apiManager.clearCache();
    }
  });

  return mcp;
}
```

## API State Management

The API Manager maintains a health state for each API:

- **HEALTHY**: API is responding normally
- **DEGRADED**: Some failures have occurred, but the API is still usable
- **FAILED**: The circuit is open, API requests are being blocked

## Tesla API Specific Features

The included TeslaApiClient implementation provides:

1. **Authentication Management**: Handles retrieving and using Tesla API credentials
2. **Cached Responses**: Vehicle data is cached for 30 seconds by default
3. **Optimized Polling**: Prevents excessive API calls
4. **Automatic Retries**: Handles transient Tesla API failures

## Configuration Options

### Circuit Breaker Options

```typescript
const circuitOptions = {
  failureThreshold: 3,     // Number of failures before opening circuit
  resetTimeout: 30000,     // Time in ms before attempting recovery
  halfOpenSuccess: 2       // Successes needed to close circuit again
};
```

### Cache Options

```typescript
const cacheOptions = {
  enabled: true,           // Enable/disable caching
  ttl: 300,                // Default time-to-live in seconds
  maxSize: 1000            // Maximum number of cached responses
};
```

## Development

To run tests:

```bash
npm test
```

To build:

```bash
bun run build
