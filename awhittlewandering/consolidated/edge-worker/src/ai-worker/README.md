# 48 Continental AI Worker

This Cloudflare Worker provides AI capabilities for the 48 Continental project, leveraging Cloudflare Workers AI to power various features across the platform. It serves as the central AI service for route optimization, charging strategy recommendations, travel content generation, and environmental impact analysis.

## Features

- **OpenAI-Compatible API Endpoints**: Compatible with existing OpenAI client libraries
  - `/v1/chat/completions` - For text generation
  - `/v1/embeddings` - For vector embeddings

- **Specialized 48 Continental Endpoints**:
  - `/route-optimization` - Tesla-specific route planning with charging considerations
  - `/charging-strategy` - Battery management recommendations
  - `/travel-highlights` - Location-based points of interest
  - `/environmental-impact` - Environmental impact assessment

## Setup

### Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Cloudflare account with Workers AI access

### Installation

1. Install dependencies:

```bash
npm install -g wrangler
```

2. Login to Cloudflare:

```bash
wrangler login
```

3. Deploy the worker:

```bash
cd edge-worker/src/ai-worker
wrangler deploy
```

## Configuration

The worker is configured via `wrangler.toml`:

```toml
[ai]
binding = "AI"  # Makes AI available as env.AI in the Worker
```

## Usage

### OpenAI-Compatible Endpoints

#### Chat Completions

```javascript
// Example: Using from another service
const response = await fetch('https://your-worker-url/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: '@cf/meta/llama-3.1-8b-instruct',
    messages: [
      { role: 'user', content: 'Suggest an interesting stop between Denver and Salt Lake City' }
    ]
  })
});

const result = await response.json();
```

#### Embeddings

```javascript
// Example: Using from another service
const response = await fetch('https://your-worker-url/v1/embeddings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: '@cf/baai/bge-large-en-v1.5',
    input: 'Tesla Model Y performance on mountain roads'
  })
});

const result = await response.json();
```

### 48 Continental Specialized Endpoints

#### Route Optimization

```javascript
// Example: Using from another service
const response = await fetch('https://your-worker-url/route-optimization', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    waypoints: [
      { location: "Denver, CO", coordinates: { lat: 39.7392, lng: -104.9903 } },
      { location: "Salt Lake City, UT", coordinates: { lat: 40.7608, lng: -111.8910 } }
    ],
    constraints: {
      maxDrivingHoursPerDay: 8,
      preferredChargingLevel: 80,
      minRemainingBattery: 20
    },
    vehicleData: {
      model: "Tesla Model Y Long Range",
      batteryCapacity: 75, // kWh
      currentBatteryLevel: 90, // percentage
      efficiency: 4.1 // miles/kWh
    }
  })
});

const result = await response.json();
```

#### Charging Strategy

```javascript
// Example: Using from another service
const response = await fetch('https://your-worker-url/charging-strategy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    routeSegment: {
      origin: "Denver, CO",
      destination: "Salt Lake City, UT",
      distance: 525, // miles
      elevation: [{ mile: 0, feet: 5280 }, { mile: 200, feet: 7200 }] // example elevation profile
    },
    batteryStatus: {
      currentLevel: 70, // percentage
      capacity: 75, // kWh
      range: 250 // miles at current charge
    },
    weather: {
      temperature: 45, // fahrenheit
      conditions: "Snow",
      windSpeed: 15 // mph
    },
    timeConstraints: {
      departureTime: "2025-06-05T08:00:00Z",
      requiredArrivalTime: "2025-06-05T18:00:00Z"
    }
  })
});

const result = await response.json();
```

#### Travel Highlights

```javascript
// Example: Using from another service
const response = await fetch('https://your-worker-url/travel-highlights', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    location: "Moab, UT",
    preferences: {
      interests: ["Hiking", "Photography", "Nature"],
      timeAvailable: 4, // hours
      accessibility: "Moderate"
    },
    radius: 30, // miles
    limit: 5 // number of recommendations
  })
});

const result = await response.json();
```

#### Environmental Impact

```javascript
// Example: Using from another service
const response = await fetch('https://your-worker-url/environmental-impact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    drivingData: {
      distance: 525, // miles
      terrain: "Mountainous",
      averageSpeed: 65, // mph
      energyUsed: 140 // kWh
    },
    vehicleSpecs: {
      model: "Tesla Model Y Long Range",
      batteryCapacity: 75, // kWh
      weight: 4416 // lbs
    },
    comparisonVehicle: {
      model: "Toyota RAV4",
      mpg: 28,
      emissionsPerMile: 0.35 // kg CO2/mile
    }
  })
});

const result = await response.json();
```

## Integration with Cline MCP

This worker is designed to be integrated with Cline as an MCP server. Add the following to your Cline MCP settings:

```json
{
  "mcpServers": {
    "github.com/continental/ai-server": {
      "autoApprove": [
        "generate_code",
        "refine_code",
        "explain_code",
        "route_optimization",
        "charging_strategy",
        "travel_highlights",
        "environmental_impact"
      ],
      "disabled": false,
      "timeout": 120,
      "transportType": "http",
      "endpoint": "https://continental-ai-worker.yourworker.workers.dev/v1/chat/completions",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer ${env.CONTINENTAL_API_KEY}"
      }
    }
  }
}
```

## Development and Testing

1. Run the worker locally:

```bash
wrangler dev
```

2. Test with curl:

```bash
curl --request POST \
  --url http://localhost:8787/v1/chat/completions \
  --header "Content-Type: application/json" \
  --data '{
    "model": "@cf/meta/llama-3.1-8b-instruct",
    "messages": [
      {
        "role": "user",
        "content": "What are some must-see stops on a road trip through Utah?"
      }
    ]
  }'
```

## Deployment

To deploy the worker to production:

```bash
wrangler deploy
```

## Models

The worker currently uses the following models:

- **Text Generation**: `@cf/meta/llama-3.1-8b-instruct`
- **Embeddings**: `@cf/baai/bge-large-en-v1.5`

You can swap these with other [models available on Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/models/).
