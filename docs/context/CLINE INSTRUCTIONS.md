# A WHITTLE WANDERING: AI AGENT DEPLOYMENT INSTRUCTIONS

## Project Identity

- __Project Name__: A Whittle Wandering
- __Website Domain__: awhittlewandering.com
- __Purpose__: Real-time tracking of a Tesla journey across all 48 continental United States

## Core Requirements

### 1. Tesla Telemetry Integration

- Implement Tessie API integration to stream real-time Tesla Model Y data
- Store vehicle telemetry in Cloudflare KV with appropriate TTL
- Create resilient error handling with fallbacks for API interruptions
- Implement secure API key management via Cloudflare Worker secrets

### 2. Waypoint Tracking System

- Use location data from `48Continental_Final_Itinerary.csv` as waypoint reference

- __Key Change__: Implement location-based waypoint tracking rather than date-based forecasting

- Create data structure for tracking waypoint status:

  ```typescript
  interface Waypoint {
    id: string;
    name: string;
    state: string;
    coordinates: [number, number]; // [longitude, latitude]
    visited: boolean;
    visitedAt?: string; // ISO timestamp when visited
    notes?: string; // Optional contextual information
  }
  ```

- Visually highlight completed waypoints on the map

- Store completion status in Cloudflare KV for persistence

### 3. MapBox Integration Enhancement

- Fix existing MapBox implementation issues:

  - Ensure proper coordinate format ([longitude, latitude])
  - Correct layer management and rendering
  - Implement proper error boundaries and loading states

- Create responsive map interface that works on all devices

- Implement clear visual indicators for:

  - Current vehicle location
  - Completed waypoints
  - Upcoming waypoints
  - Travel path/history

### 4. State Visit Tracker

- Implement visual component showing all 48 continental states
- Track states visited during the journey
- Create color-coded map overlay showing visited vs. unvisited states
- Implement state detection algorithm using vehicle's GPS coordinates
- Store state visit data in Cloudflare KV

### 5. Cloudflare Deployment Configuration

- Complete migration from Cloudflare Pages to Workers
- Configure necessary KV namespaces and bindings
- Set up proper CORS headers and security policies
- Implement caching strategies for static assets and API responses
- Create proper CI/CD pipeline for automated deployments

## Implementation Guidelines

### Data Architecture

- __Vehicle Data__: Real-time stream from Tessie API, cached in KV
- __Waypoint Data__: Static base from CSV, dynamic status in KV
- __State Visit Data__: Dynamic tracking in KV with timestamp
- __Map Configuration__: Mapbox token and settings in environment variables

### UI Components

- Live map showing current location and route
- Waypoint status indicators
- State visit tracker/counter
- Vehicle telemetry dashboard (speed, battery, charging status)
- Trip statistics (states visited, miles traveled, etc.)

### Technical Specifications

- __Frontend__: React with TypeScript

- __Backend__: Cloudflare Workers for API and site hosting

- __Data Storage__: Cloudflare KV for state persistence

- __APIs__:

  - Tessie API for Tesla data
  - Mapbox for mapping
  - OpenWeather for weather data (if applicable)

### Performance Requirements

- Map rendering optimized for mobile devices
- Progressive loading for performance
- Maximum 2-second response time for API endpoints
- Graceful degradation when APIs are unavailable

## Testing and Validation

- Test vehicle data flow with simulated GPS coordinates
- Verify waypoint detection with test coordinates
- Validate state boundary detection algorithm
- Test responsive design across multiple device sizes

## Deployment Checklist

- All required environment variables configured
- KV namespace bindings verified
- API keys securely stored in Worker secrets
- CORS headers properly configured
- Cache policies implemented
- DNS configuration validated

The implementation should focus on creating a reliable, real-time tracking experience that accurately displays the Tesla's journey across the 48 continental states, emphasizing waypoint achievements and state visits rather than adhering to a specific timeline.
## Future Enhancements

- Implement user authentication and profile management
- Add support for multiple vehicles and user accounts
- Enhance map features with terrain and satellite views
- Integrate additional data sources (e.g., traffic, weather)
- Improve performance and scalability of backend services