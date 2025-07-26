# API Response Documentation

This document outlines the expected response formats for all external APIs used in the AWhittleWandering Tesla Tracker project.

## 1. Tessie API (Tesla Vehicle Data)

**Base URL:** `https://api.tessie.com`

### Authentication

```text
Authorization: Bearer <tessie_api_key>
```

### Get Vehicles

**Endpoint:** `GET /vehicles`

**Response:**

```json
{
  "results": [
    {
      "vin": "5YJ3E1EA3KF123456",
      "last_state": {
        "id_s": "123456789",
        "display_name": "Midnight Shadow",
        "state": "online"
      }
    }
  ]
}
```

### Get Vehicle State
**Endpoint:** `GET /{vin}/state`

**Response:**
```json
{
  "charge_state": {
    "battery_level": 82,
    "battery_range": 267.5,
    "charging_state": "Complete"
  },
  "climate_state": {
    "inside_temp": 22.0,
    "outside_temp": 25.5
  },
  "drive_state": {
    "latitude": 41.1669,
    "longitude": -73.3891,
    "heading": 67,
    "speed": null
  },
  "vehicle_state": {
    "odometer": 70128.5
  },
  "timestamp": 1627845000000
}
```

### Get Historical Drives
**Endpoint:** `GET /{vin}/drives?from={unix_timestamp}&to={unix_timestamp}`

**Parameters:**
- `from`: Unix timestamp in seconds (start date)
- `to`: Unix timestamp in seconds (end date)
- `distance_format`: "mi" or "km" (default: "mi")

**Response:**
```json
{
  "results": [
    {
      "id": 1363162,
      "started_at": 1628960959,
      "ended_at": 1628970656,
      "starting_location": "8055 Dean Martin Drive, Las Vegas, Nevada 89139, United States",
      "starting_latitude": 36.042928,
      "starting_longitude": -115.187801,
      "ending_location": "Cataba Road, Hesperia, California 92344, United States",
      "ending_latitude": 34.42468,
      "ending_longitude": -117.385746,
      "starting_battery": 97,
      "ending_battery": 21,
      "average_inside_temperature": 20.23,
      "average_outside_temperature": 34.94,
      "average_speed": 73,
      "max_speed": 90,
      "rated_range_used": 230.45,
      "odometer_distance": 185.9,
      "energy_used": 73.28,
      "tag": "Personal"
    }
  ]
}
```

### Get Historical Charges
**Endpoint:** `GET /{vin}/charges?from={unix_timestamp}&to={unix_timestamp}`

**Parameters:**
- `from`: Unix timestamp in seconds (start date)
- `to`: Unix timestamp in seconds (end date)
- `superchargers_only`: boolean (default: false)

**Response:**
```json
{
  "results": [
    {
      "id": 434159,
      "started_at": 1628906796,
      "ended_at": 1628911246,
      "location": "South Las Vegas Boulevard, Las Vegas, Nevada 89119, United States",
      "latitude": 36.070656,
      "longitude": -115.172968,
      "is_supercharger": true,
      "odometer": 12345.67,
      "energy_added": 81.41,
      "energy_used": 81.5,
      "miles_added": 256,
      "miles_added_ideal": 512,
      "starting_battery": 11,
      "ending_battery": 96,
      "cost": 0
    }
  ]
}
```

## 2. Mapbox API

**Base URL:** `https://api.mapbox.com`

### Authentication
```
access_token={mapbox_token}
```

### Mapbox GL JS
**CDN:** `https://api.mapbox.com/mapbox-gl-js/`

**Usage:** Map rendering, geocoding, routing

**Key Methods:**
- `mapboxgl.accessToken = token`
- `new mapboxgl.Map(options)`
- `map.addSource(id, source)`
- `map.addLayer(layer)`

**Style URLs:**
- `mapbox://styles/mapbox/dark-v11`
- `mapbox://styles/mapbox/satellite-v9`
- `mapbox://styles/mapbox/streets-v11`

### Geocoding API
**Endpoint:** `GET /geocoding/v5/mapbox.places/{query}.json`

**Response:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "place_name": "Connecticut, United States",
      "center": [-72.7273, 41.6032],
      "geometry": {
        "type": "Point",
        "coordinates": [-72.7273, 41.6032]
      },
      "properties": {
        "short_code": "us-ct"
      }
    }
  ]
}
```

### Directions API
**Endpoint:** `GET /directions/v5/mapbox/driving/{coordinates}`

**Response:**
```json
{
  "routes": [
    {
      "geometry": "encoded_polyline_string",
      "distance": 185900.4,
      "duration": 7697.4,
      "legs": [
        {
          "distance": 185900.4,
          "duration": 7697.4,
          "steps": []
        }
      ]
    }
  ]
}
```

## 3. OpenWeatherMap API (Future Use)

**Base URL:** `https://api.openweathermap.org/data/2.5`

### Authentication
```
appid={api_key}
```

### Current Weather
**Endpoint:** `GET /weather?lat={lat}&lon={lon}&appid={api_key}&units=metric`

**Response:**
```json
{
  "coord": {
    "lon": -73.39,
    "lat": 41.17
  },
  "weather": [
    {
      "id": 800,
      "main": "Clear",
      "description": "clear sky",
      "icon": "01d"
    }
  ],
  "main": {
    "temp": 25.5,
    "feels_like": 27.2,
    "temp_min": 23.1,
    "temp_max": 28.3,
    "pressure": 1013,
    "humidity": 65
  },
  "wind": {
    "speed": 3.6,
    "deg": 240
  },
  "visibility": 10000,
  "dt": 1627845600,
  "timezone": -14400,
  "name": "Greenwich"
}
```

## 4. Our Backend API (Cloudflare Workers)

**Base URL:** `https://awhittlewandering-api.{subdomain}.workers.dev`

### Upload Media
**Endpoint:** `POST /api/upload`

**Request:**
```
Content-Type: multipart/form-data

file: <binary_data>
location: JSON string
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "uuid",
    "name": "photo.jpg",
    "url": "https://storage.example.com/uploads/photo.jpg",
    "type": "image/jpeg",
    "size": 1024000,
    "location": {
      "state": "Connecticut",
      "coordinates": {
        "lat": 41.1669,
        "lng": -73.3891
      }
    },
    "uploadedAt": "2025-07-26T18:30:00Z"
  }
}
```

### Get Media
**Endpoint:** `GET /api/media`

**Response:**
```json
{
  "media": [
    {
      "id": "uuid",
      "type": "photo",
      "url": "https://storage.example.com/uploads/photo.jpg",
      "thumbnailUrl": "https://storage.example.com/thumbs/photo.jpg",
      "title": "Tesla at Grand Canyon",
      "description": "Amazing sunset with the Model 3",
      "location": "Grand Canyon, Arizona",
      "coordinates": {
        "lat": 36.1069,
        "lng": -112.1129
      },
      "timestamp": "2025-06-15T19:30:00Z",
      "metadata": {
        "camera": "iPhone 15 Pro",
        "weather": "Clear skies, 75°F"
      }
    }
  ]
}
```

## 5. Data Transformation Mapping

### Tessie → Our Interface

**Drives:**
```typescript
// Tessie API → Our HistoricalDrive interface
{
  id: drive.id,
  start_time: new Date(drive.started_at * 1000).toISOString(),
  end_time: new Date(drive.ended_at * 1000).toISOString(),
  start_address: drive.starting_location,
  end_address: drive.ending_location,
  distance_miles: drive.odometer_distance,
  duration_hours: (drive.ended_at - drive.started_at) / 3600,
  start_battery_level: drive.starting_battery,
  end_battery_level: drive.ending_battery,
  start_coordinates: {
    lat: drive.starting_latitude,
    lng: drive.starting_longitude
  },
  end_coordinates: {
    lat: drive.ending_latitude,
    lng: drive.ending_longitude
  }
}
```

**Charges:**
```typescript
// Tessie API → Our HistoricalCharge interface
{
  id: charge.id,
  start_time: new Date(charge.started_at * 1000).toISOString(),
  end_time: new Date(charge.ended_at * 1000).toISOString(),
  location: charge.location,
  energy_added_kwh: charge.energy_added,
  cost: charge.cost,
  start_battery_level: charge.starting_battery,
  end_battery_level: charge.ending_battery,
  coordinates: {
    lat: charge.latitude,
    lng: charge.longitude
  }
}
```

## 6. Error Handling

### Common Error Responses

**Tessie API Errors:**
```json
{
  "error": "Invalid VIN",
  "message": "The provided VIN is not valid or not accessible"
}
```

**Rate Limiting:**
```json
{
  "error": "Rate limit exceeded",
  "retry_after": 60
}
```

**Authentication Errors:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

## 7. Environment Variables

```bash
# Tessie API
VITE_TESSIE_API_KEY=tessie_api_key_here

# Mapbox
VITE_MAPBOX_TOKEN=mapbox_public_token_here

# OpenWeather (Future)
VITE_OPENWEATHER_API_KEY=openweather_api_key_here

# Backend API
VITE_API_BASE_URL=https://awhittlewandering-api.subdomain.workers.dev
```

## 8. TypeScript Interfaces

All interfaces are defined in their respective hook/component files:
- `useTessieApi.ts` - Tessie API types
- `TeslaMap.tsx` - Mapbox types
- Backend types in `backend/edge-worker/src/index.ts`

## Notes

1. **Date Formats:** Tessie uses Unix timestamps (seconds), JavaScript uses milliseconds
2. **Field Names:** Tessie uses different field names than expected (e.g., `odometer_distance` not `distance_miles`)
3. **Rate Limits:** Tessie has rate limiting, implement exponential backoff
4. **CORS:** Mapbox and Tessie APIs support CORS for browser requests
5. **Authentication:** All APIs use different auth methods (Bearer tokens, query params, etc.)
