# Vehicle Onboarding API Implementation Notes

## Requirement
When a car is onboarded (API added to AWW), a question should be asked when the vehicle was purchased so we have a start date to start historical drive data batch requests.

## Current State
- Vehicles are currently created in `ensureVehicleAndJourney()` with hardcoded values
- The system now supports a `purchased_date` field in the vehicles table
- Historical data imports now respect the `purchased_date` if present

## Implementation Options

### Option 1: Admin API Endpoint (Recommended)
Add a POST endpoint to `/api/v1/admin/vehicles` that accepts:
```json
{
  "id": "midnight-shadow",
  "vin": "5YJYGDEE5LF027324",
  "display_name": "Midnight Shadow",
  "model": "Model Y",
  "year": 2023,
  "purchased_date": "2023-03-15",
  "tessie_api_token": "optional_vehicle_specific_token"
}
```

### Option 2: Update ensureVehicleAndJourney()
Modify the hardcoded vehicle creation to include a purchased_date parameter:
```typescript
await this.db.prepare(
  `INSERT OR IGNORE INTO vehicles (id, vin, display_name, model, year, purchased_date, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
).bind('midnight-shadow', vin, 'Midnight Shadow', 'Model Y', 2023, '2023-03-15', now, now).run();
```

### Option 3: Environment Variable
Add a `VEHICLE_PURCHASED_DATE` secret that can be set during onboarding:
```bash
wrangler secret put VEHICLE_PURCHASED_DATE
# Enter value: 2023-03-15
```

## Validation Rules
- `purchased_date` must be a valid ISO 8601 date (YYYY-MM-DD)
- `purchased_date` must be >= 2012-06-01 (earliest Tesla Model S delivery)
- `purchased_date` must be <= current date
- `purchased_date` is optional (nullable) - falls back to 2012-06-01 if not provided

## Benefits
1. Reduces unnecessary API calls to Tessie for data before vehicle existed
2. Improves performance during historical data ingestion (fewer 30-day windows to query)
3. More accurate data boundaries for analytics
4. Example: A 2023 vehicle only needs ~24 months of history vs. 156+ months from 2012

## Example Performance Improvement
- **Before**: Vehicle from 2023 would query from 2012-06-01 to present = 156 months = 156 API calls
- **After**: Vehicle from 2023-03-15 queries from 2023-03-15 to present = ~35 months = 35 API calls
- **Savings**: 121 fewer API calls (~78% reduction)
