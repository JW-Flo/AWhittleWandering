# MCP Server Tools for 48 Continental Project

## Context
This prompt file defines tools and capabilities for the MCP server that extends GitHub Copilot's functionality specifically for the 48 Continental project.

## Tool Definitions

### Vehicle Telemetry Tool
```json
{
  "name": "vehicle_telemetry",
  "description": "Fetches and analyzes real-time vehicle telemetry data",
  "parameters": {
    "type": "object",
    "properties": {
      "timeframe": {
        "type": "string",
        "description": "Time range for data retrieval (e.g., 'last_hour', 'last_day')"
      },
      "metrics": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": ["location", "battery", "speed", "temperature", "charging_status"]
        }
      },
      "aggregate": {
        "type": "boolean",
        "description": "Whether to return aggregated data"
      }
    },
    "required": ["timeframe", "metrics"]
  }
}
```

### Route Analysis Tool
```json
{
  "name": "route_analysis",
  "description": "Analyzes route data and charging stops",
  "parameters": {
    "type": "object",
    "properties": {
      "start_point": {
        "type": "object",
        "properties": {
          "lat": { "type": "number" },
          "lng": { "type": "number" }
        }
      },
      "end_point": {
        "type": "object",
        "properties": {
          "lat": { "type": "number" },
          "lng": { "type": "number" }
        }
      },
      "include_charging_stops": {
        "type": "boolean",
        "default": true
      },
      "optimize_for": {
        "type": "string",
        "enum": ["time", "energy", "scenic_route"]
      }
    },
    "required": ["start_point", "end_point"]
  }
}
```

### System Health Monitor
```json
{
  "name": "system_health_check",
  "description": "Monitors health of all system components",
  "parameters": {
    "type": "object",
    "properties": {
      "components": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": ["mcp_server", "vehicle_tracker", "edge_worker", "website"]
        }
      },
      "check_type": {
        "type": "string",
        "enum": ["quick", "comprehensive"]
      },
      "alert_threshold": {
        "type": "string",
        "enum": ["info", "warning", "error"]
      }
    },
    "required": ["components", "check_type"]
  }
}
```

### Map Data Manager
```json
{
  "name": "map_data_manager",
  "description": "Manages map data and visualization layers",
  "parameters": {
    "type": "object",
    "properties": {
      "layer_type": {
        "type": "string",
        "enum": ["route", "charging_stations", "points_of_interest", "weather"]
      },
      "viewport": {
        "type": "object",
        "properties": {
          "center": {
            "type": "object",
            "properties": {
              "lat": { "type": "number" },
              "lng": { "type": "number" }
            }
          },
          "zoom": { "type": "number" }
        }
      },
      "data_freshness": {
        "type": "string",
        "enum": ["realtime", "cached"]
      }
    },
    "required": ["layer_type"]
  }
}
```

## Skillsets

### Vehicle Monitoring
- Track real-time vehicle position
- Monitor battery levels and charging status
- Analyze driving patterns and efficiency
- Predict range and suggest charging stops
- Handle connectivity interruptions

### Route Optimization
- Calculate optimal routes between charging stations
- Consider weather conditions and elevation
- Optimize for scenic routes when possible
- Handle dynamic rerouting based on conditions
- Manage charging station availability

### System Integration
- Coordinate data flow between components
- Handle data persistence and caching
- Manage WebSocket connections
- Implement fallback mechanisms
- Monitor system performance

### Map Visualization
- Manage map tile loading
- Handle dynamic data layers
- Optimize marker clustering
- Implement smooth animations
- Manage viewport updates

## Response Templates

### Status Update
```typescript
interface StatusUpdate {
  timestamp: number;
  component: string;
  status: 'healthy' | 'warning' | 'error';
  metrics: {
    response_time?: number;
    error_rate?: number;
    uptime?: number;
  };
  message: string;
}
```

### Health Check
```typescript
interface HealthCheck {
  system_status: {
    mcp_server: ComponentStatus;
    vehicle_tracker: ComponentStatus;
    edge_worker: ComponentStatus;
    website: ComponentStatus;
  };
  last_checked: number;
  alerts: Alert[];
}

interface ComponentStatus {
  status: 'up' | 'down' | 'degraded';
  latency: number;
  error_rate: number;
  message?: string;
}
```

## Error Handling
All tools should implement proper error handling with:
- Detailed error messages
- Retry mechanisms for transient failures
- Fallback options when possible
- Proper error propagation
- Monitoring integration
