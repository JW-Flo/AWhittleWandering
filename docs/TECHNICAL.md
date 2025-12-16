# A Whittle Wandering (AWW) - Technical Documentation

## System Architecture

### Overview
AWW is a multi-tenant platform for tracking EV road trips with compartmentalized data storage per journey.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│  - Journey Creation Wizard                                       │
│  - Interactive Map (Mapbox)                                      │
│  - Analytics Dashboard                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Backend                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Auth      │  │  Database   │  │   Storage   │             │
│  │  (Users)    │  │ (Metadata)  │  │  (Photos)   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Edge Functions                              │   │
│  │  - journey-storage (D1 provisioning)                    │   │
│  │  - vehicle-api (Tessie/Fleet API proxy)                 │   │
│  │  - tessie-cloudflare-sync (data sync)                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloudflare (Compartmentalized Storage)              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ D1: Journey │  │ D1: Journey │  │ D1: Journey │             │
│  │     #1      │  │     #2      │  │     #N      │             │
│  │ (Drives,    │  │ (Drives,    │  │ (Drives,    │             │
│  │  Charges)   │  │  Charges)   │  │  Charges)   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Compartmentalization Strategy

### Why Cloudflare D1 Per Journey?

1. **True Isolation**: Each journey's telemetry data is in a completely separate database
2. **Cost Efficiency**: D1 is cheaper than Supabase for high-volume telemetry storage
3. **Security**: No risk of cross-user data leakage through SQL injection or RLS misconfiguration
4. **Performance**: Queries only touch relevant data, no filtering needed
5. **Portability**: Users can export/migrate their D1 database if needed

### Data Flow

```
Vehicle API (Tessie/Fleet)
         │
         ▼
┌─────────────────────┐
│  Edge Function:     │
│  vehicle-sync       │
│                     │
│  1. Fetch from API  │
│  2. Get journey's   │
│     D1 database ID  │
│  3. Write to D1     │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Cloudflare D1      │
│  (Per-Journey)      │
│                     │
│  - drives table     │
│  - charges table    │
│  - sync_log table   │
└─────────────────────┘
```

---

## Database Schema

### Supabase (Metadata & Auth)

#### journeys
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner (FK to auth.users) |
| name | TEXT | Journey name |
| description | TEXT | Optional description |
| start_date | DATE | Journey start |
| end_date | DATE | Journey end (null if ongoing) |
| vehicle_id | UUID | FK to vehicles |
| cloudflare_d1_id | TEXT | D1 database UUID |
| cloudflare_d1_name | TEXT | D1 database name |
| data_storage_type | TEXT | 'supabase' or 'cloudflare_d1' |
| is_public | BOOLEAN | Visibility |
| total_miles | NUMERIC | Calculated stat |
| total_kwh | NUMERIC | Calculated stat |
| states_count | INTEGER | Calculated stat |

#### vehicles
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner |
| nickname | TEXT | Display name |
| make | TEXT | Manufacturer |
| model | TEXT | Model name |
| year | INTEGER | Model year |
| vin | TEXT | Vehicle ID (encrypted) |
| api_provider_id | UUID | FK to api_providers |
| api_credential_id | UUID | FK to user_api_credentials |

#### user_api_credentials
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner |
| provider_id | UUID | FK to api_providers |
| encrypted_token | TEXT | Encrypted API key |
| is_valid | BOOLEAN | Validation status |
| last_verified_at | TIMESTAMP | Last verification |
| error_message | TEXT | Last error if invalid |

### Cloudflare D1 (Per-Journey Telemetry)

#### drives
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID primary key |
| drive_id | INTEGER | API drive ID (unique) |
| started_at | TEXT | ISO timestamp |
| ended_at | TEXT | ISO timestamp |
| starting_latitude | REAL | Start GPS |
| starting_longitude | REAL | Start GPS |
| starting_location | TEXT | Reverse geocoded |
| starting_odometer | REAL | Miles |
| starting_battery | INTEGER | SOC % |
| ending_latitude | REAL | End GPS |
| ending_longitude | REAL | End GPS |
| ending_location | TEXT | Reverse geocoded |
| ending_odometer | REAL | Miles |
| ending_battery | INTEGER | SOC % |
| odometer_distance | REAL | Trip miles |
| energy_used | REAL | kWh |
| average_speed | REAL | mph |
| max_speed | REAL | mph |
| synced_at | TEXT | Last sync time |

#### charges
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | UUID primary key |
| charge_id | INTEGER | API charge ID |
| started_at | TEXT | ISO timestamp |
| ended_at | TEXT | ISO timestamp |
| latitude | REAL | Charger GPS |
| longitude | REAL | Charger GPS |
| location | TEXT | Charger name |
| energy_added | REAL | kWh |
| start_battery | INTEGER | SOC % |
| end_battery | INTEGER | SOC % |
| max_charge_rate | REAL | kW |
| charger_type | TEXT | SC/Destination/etc |
| cost | REAL | USD |

---

## Edge Functions

### journey-storage
Provisions and manages D1 databases for journeys.

**Actions:**
- `provision`: Create new D1 database with schema
- `status`: Get D1 stats for a journey
- `delete`: Remove D1 database (cleanup)

**Request:**
```json
{
  "action": "provision",
  "journeyId": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "d1DatabaseId": "cf-d1-uuid",
  "d1DatabaseName": "aww-journey-abc12345"
}
```

### vehicle-api
Proxy for vehicle API calls (Tessie, Tesla Fleet).

### tessie-cloudflare-sync
Syncs vehicle data to the journey's D1 database.

### d1-stats
Admin-only endpoint for querying D1 statistics.

---

## Journey Creation Flow

### Step 1: User Creates Journey
```typescript
const { data: journey } = await supabase
  .from('journeys')
  .insert({
    user_id: user.id,
    name: 'My Road Trip',
    start_date: '2025-06-01',
    vehicle_id: selectedVehicleId,
  })
  .select()
  .single();
```

### Step 2: Provision D1 Storage
```typescript
const { data } = await supabase.functions.invoke('journey-storage', {
  body: {
    action: 'provision',
    journeyId: journey.id,
  },
});
// D1 database created and linked to journey
```

### Step 3: Configure Sync Schedule
The platform automatically schedules syncs via pg_cron:
- Hourly sync for active journeys
- Sync triggered on app open

### Step 4: Data Flows to Compartmentalized Storage
```
User's Vehicle → Tessie API → Edge Function → User's D1 Database
```

---

## Security Model

### Authentication
- Supabase Auth with email/password
- Optional 2FA (TOTP) - required for admins
- Session management with automatic refresh

### Authorization (RLS)
- All Supabase tables have RLS enabled
- Users can only access their own data
- Public journeys readable by anyone
- Followers can access approved journeys

### Data Encryption
- API credentials encrypted at rest
- D1 databases isolated per journey
- No cross-user data queries possible

### API Security
- All edge functions validate JWT
- Rate limiting on sync endpoints
- API tokens never exposed to frontend

---

## API Providers

### Supported
| Provider | Auth Type | Supported Makes |
|----------|-----------|-----------------|
| Tessie | API Key | Tesla |
| Tesla Fleet | OAuth | Tesla |
| Smartcar | OAuth | Multi-brand |

### Adding API Credentials
1. User selects vehicle make
2. System shows compatible providers
3. User follows setup guide for chosen provider
4. Token stored encrypted in user_api_credentials
5. System validates token before accepting

---

## Cron Jobs

| Name | Schedule | Function |
|------|----------|----------|
| tessie-sync-hourly | 0 * * * * | Sync to Supabase |
| tessie-cloudflare-sync-hourly | 30 * * * * | Sync to Cloudflare D1 |

---

## Environment Variables

### Supabase Secrets
| Name | Description |
|------|-------------|
| TESSIE_API_KEY | Platform Tessie key (flagship) |
| MAPBOX_TOKEN | Map rendering |
| CLOUDFLARE_API_TOKEN | D1 management |
| CLOUDFLARE_ACCOUNT_ID | CF account |
| CLOUDFLARE_D1_DATABASE_ID | Flagship D1 |
| RESEND_API_KEY | Email notifications |
| TWILIO_ACCOUNT_SID | SMS notifications |
| TWILIO_AUTH_TOKEN | SMS auth |

---

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `TESSIE_API_KEY not configured` | Missing secret | Add to Supabase secrets |
| `Cloudflare credentials not configured` | Missing CF secrets | Add CF secrets |
| `Unauthorized` | Invalid/expired JWT | Re-authenticate |
| `Journey not found` | Wrong ID or no access | Check ownership |
| `D1 query failed` | Invalid SQL or D1 issue | Check logs |

---

## Monitoring

### Edge Function Logs
Access via Supabase dashboard or `supabase--edge-function-logs` tool.

### D1 Sync Status
Query `sync_log` table in each D1 database:
```sql
SELECT * FROM sync_log ORDER BY synced_at DESC LIMIT 10;
```

### Health Checks
- Vehicle API validation on credential save
- D1 connectivity check on provision
- Sync status in admin portal
