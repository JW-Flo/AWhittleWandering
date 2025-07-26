# API Reference Guide

Complete documentation for all external APIs used in the AWhittleWandering Tesla Tracker project.

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

```text
access_token={mapbox_token}
```

### Mapbox GL JS Integration

**CDN:** `https://api.mapbox.com/mapbox-gl-js/`

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

## 3. Data Transformation Mapping

### Tessie API → Application Interface

**Drives Mapping:**

```typescript
// Transform Tessie API response to our interface
{
  id: drive.id,
  start_time: new Date(drive.started_at * 1000).toISOString(),
  end_time: new Date(drive.ended_at * 1000).toISOString(),
  start_address: drive.starting_location,
  end_address: drive.ending_location,
  distance_miles: drive.odometer_distance, // KEY: odometer_distance, not distance_miles
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

**Charges Mapping:**

```typescript
// Transform Tessie API response to our interface
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

## 4. Critical Field Mappings

### Tessie API Field Names

**IMPORTANT:** Tessie uses different field names than expected:

| Our Interface | Tessie API Field | Notes |
|---------------|------------------|--------|
| `distance_miles` | `odometer_distance` | Critical for mileage calculations |
| `start_time` | `started_at` (Unix seconds) | Convert to milliseconds |
| `end_time` | `ended_at` (Unix seconds) | Convert to milliseconds |
| `start_coordinates.lat` | `starting_latitude` | Direct mapping |
| `start_coordinates.lng` | `starting_longitude` | Direct mapping |
| `end_coordinates.lat` | `ending_latitude` | Direct mapping |
| `end_coordinates.lng` | `ending_longitude` | Direct mapping |

### Date Handling

```typescript
// Tessie returns Unix timestamps in SECONDS
// JavaScript Date expects MILLISECONDS
const jsDate = new Date(tessieTimestamp * 1000);
```

## 5. Error Handling

### Common API Errors

**Tessie Authentication Error:**

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

**Tessie Rate Limiting:**

```json
{
  "error": "Rate limit exceeded",
  "retry_after": 60
}
```

**Mapbox Authentication Error:**

```json
{
  "message": "Not Authorized - Invalid Token"
}
```

## 6. Environment Variables

```bash
# Tessie API (Required)
VITE_TESSIE_API_KEY=tessie_api_key_here

# Mapbox (Required)
VITE_MAPBOX_TOKEN=mapbox_public_token_here

# Backend API (Required)
VITE_API_BASE_URL=https://awhittlewandering-api.subdomain.workers.dev

# OpenWeather (Future Use)
VITE_OPENWEATHER_API_KEY=openweather_api_key_here
```

## 7. API Usage Summary

### Current Integrations

1. **Tessie API** - Tesla vehicle data (drives, charges, state)
2. **Mapbox GL JS** - Interactive mapping and visualization
3. **Backend API** - Media upload and management

### Data Flow

1. Tessie API provides raw Tesla data
2. Data is transformed using correct field mappings
3. Mapbox renders the geographical visualization
4. Backend API handles media uploads and storage

## 8. Known Issues & Solutions

### Issue: Zero Miles Displayed

**Cause:** Incorrect field mapping (`distance_miles` vs `odometer_distance`)

**Solution:** Use `drive.odometer_distance` from Tessie API

### Issue: Wrong Date Format

**Cause:** Tessie uses Unix seconds, JavaScript expects milliseconds

**Solution:** Multiply Tessie timestamps by 1000

### Issue: API Parameters

**Cause:** Using `start_date`/`end_date` instead of `from`/`to`

**Solution:** Use Unix timestamp parameters `from` and `to`

## Notes

- Always verify API field names against official documentation
- Implement exponential backoff for rate-limited APIs
- All external APIs support CORS for browser requests
- Test data transformations with real API responses
