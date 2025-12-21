# A Whittle Wandering (AWW) - Technical Documentation

## System Architecture

### Overview
AWW is a multi-tenant platform for tracking EV road trips with compartmentalized data storage per journey.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React 19)                       │
│  - Journey Creation Wizard                                       │
│  - Interactive Map (Mapbox GL JS)                               │
│  - Analytics Dashboard                                           │
│  - Voice Journal with Transcription                             │
│  - Unified Trip Timeline                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Supabase Backend                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Auth      │  │  Database   │  │   Storage   │             │
│  │  (Users)    │  │ (35 Tables) │  │  (Photos)   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Edge Functions (28 Total)                   │   │
│  │  - journey-storage (D1 provisioning)                    │   │
│  │  - vehicle-api (Tessie/Fleet API proxy)                 │   │
│  │  - tessie-cloudflare-sync (data sync)                   │   │
│  │  - voice-transcribe (OpenAI Whisper)                    │   │
│  │  - send-memory-reminder (daily prompts)                 │   │
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

## Recent Features

### Voice Journal (December 2024)
- Record voice memos during travels
- Automatic transcription via OpenAI Whisper
- Location and waypoint association
- Mood tagging and people met tracking

### Memory Prompts (December 2024)
- Smart nudges based on GPS dwell time analysis
- Identifies locations where user spent 30+ minutes
- Non-prescriptive prompts ("Did you meet someone new?")
- Integrates with journal entries

### Unified Trip Timeline (December 2024)
- Chronological interleaving of all journey events
- Groups by day with collapsible sections
- Supports journal entries, photos, videos, charges, state crossings
- Inline audio playback for voice notes

### Spotify Integration (November 2024)
- OAuth connection to Spotify
- Track listening history during drives
- Associate tracks with waypoints/locations

---

## Archive & Retention Policy

### User Activity Status
- **Active user**: Last login within 90 days
- **Inactive user**: No login for 90+ days

### Archive Retention
- **Active users**: Archived journeys retained for 1 year (365 days)
- **Inactive users**: Archived journeys retained for 90 days
- **Maximum total storage for inactive users**: 180 days (90 days inactive + 90 days retention)

### Reminder Emails (with unsubscribe links)
1. **Inactive notification**: Sent when user becomes inactive (90 days no login)
2. **Deletion warning**: Sent 2 weeks before archived journey deletion
3. All emails include List-Unsubscribe headers for one-click unsubscribe

### Automated Cleanup Cron (Daily 3am UTC)
- Updates archive expiration for newly inactive users
- Sends warning emails for journeys expiring within 14 days
- Permanently deletes expired archived journeys and their D1 databases
- Notifies users when their data has been deleted

---

## Platform Limits

| Resource | Limit | Rationale |
|----------|-------|-----------|
| **Journeys per user** | 5 | Controls Cloudflare D1 provisioning costs |
| **Media storage** | Unlimited | RLS-protected shared bucket |

The journey limit is enforced in `JourneyCreationWizard.tsx` via the `MAX_JOURNEYS_PER_USER` constant (currently set to 5). Users see their current usage and are blocked from creating new journeys when at capacity.

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

### Supabase Tables (35 Total)

#### Core Tables
| Table | Purpose |
|-------|---------|
| `journeys` | User road trips with D1 database references |
| `vehicles` | User vehicles with API provider links |
| `user_api_credentials` | Encrypted API tokens |
| `drive_data` | GPS telemetry points |
| `charging_sessions` | EV charging events |
| `states_visited` | State crossing records |

#### User & Auth Tables
| Table | Purpose |
|-------|---------|
| `profiles` | User profile data with privacy settings |
| `user_roles` | Role assignments (admin, user, premium) |
| `beta_testers` | Beta access codes |
| `trusted_devices` | Device fingerprints for security |
| `login_attempts` | Auth attempt logging |
| `login_alerts` | Suspicious login notifications |
| `account_lockouts` | Brute-force protection |

#### Journey Feature Tables
| Table | Purpose |
|-------|---------|
| `journal_entries` | Text/voice journal entries |
| `journey_media` | Photos/videos with location privacy |
| `journey_tracks` | Spotify listening history |
| `journey_followers` | Follow relationships |
| `journey_notification_settings` | Per-journey notification prefs |
| `flagship_waypoints` | Curated waypoints for flagship journey |

#### Notification Tables
| Table | Purpose |
|-------|---------|
| `notification_preferences` | User notification settings |
| `notification_queue` | Pending notifications |
| `sms_consent_log` | TCPA compliance records |

#### Admin & Security Tables
| Table | Purpose |
|-------|---------|
| `security_audit_log` | Security event logging |
| `security_scan_results` | Automated security scans |
| `incident_log` | Security incidents |
| `page_views` | Analytics |
| `blocked_visitors` | Blocked IPs/visitors |
| `data_retention_config` | Retention policy settings |

### Cloudflare D1 Schema (Per-Journey)

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

## Edge Functions (28 Total)

### Authentication & Security

| Function | JWT | Secrets | Purpose |
|----------|-----|---------|---------|
| `auth-security` | ✅ | ENCRYPTION_KEY | Login security checks, device fingerprinting |
| `beta-auth` | ❌ | - | Beta access code validation |
| `security-audit` | ✅ | - | Security scanning and audit logging |
| `incident-remediation` | ✅ | - | Security incident response |

### Vehicle & Data Sync

| Function | JWT | Secrets | Purpose |
|----------|-----|---------|---------|
| `tessie` | ✅ | TESSIE_API_KEY | Direct Tessie API proxy |
| `tessie-sync` | ✅ | TESSIE_API_KEY | Sync vehicle data to Supabase |
| `tessie-cloudflare-sync` | ✅ | TESSIE_API_KEY, CF_* | Sync to Cloudflare D1 |
| `vehicle-api` | ✅ | Various | Multi-provider vehicle API proxy |
| `extract-waypoints` | ✅ | - | Parse waypoints from GPS telemetry |

### Journey Management

| Function | JWT | Secrets | Purpose |
|----------|-----|---------|---------|
| `journey-storage` | ✅ | CF_API_TOKEN, CF_ACCOUNT_ID | D1 database provisioning |
| `route-navigator` | ✅ | - | Route calculation and navigation |
| `csv-import` | ✅ | - | Import telemetry from CSV files |
| `generate-test-journey` | ✅ | - | Create test journey data |

### Notifications

| Function | JWT | Secrets | Purpose |
|----------|-----|---------|---------|
| `send-sms` | ✅ | TWILIO_* | Twilio SMS dispatch |
| `send-email-digest` | ❌ | RESEND_API_KEY | Resend email digests (cron) |
| `send-memory-reminder` | ❌ | RESEND_API_KEY | Daily memory prompts (cron) |
| `send-archive-reminder` | ❌ | RESEND_API_KEY | Archive expiry warnings (cron) |

### Integrations

| Function | JWT | Secrets | Purpose |
|----------|-----|---------|---------|
| `spotify-auth` | ✅ | SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET | Spotify OAuth flow |
| `weather` | ✅ | WEATHER_API_KEY | Weather data for locations |
| `get-mapbox-token` | ✅ | MAPBOX_TOKEN | Secure Mapbox token delivery |
| `voice-transcribe` | ✅ | OPENAI_API_KEY | OpenAI Whisper transcription |

### Media & Storage

| Function | JWT | Secrets | Purpose |
|----------|-----|---------|---------|
| `signed-url` | ✅ | - | Generate signed URLs for private media |
| `track-view` | ❌ | - | Anonymous page view tracking |

### Admin

| Function | JWT | Secrets | Purpose |
|----------|-----|---------|---------|
| `admin-users` | ✅ | - | User management (admin only) |
| `d1-stats` | ✅ | CF_* | D1 database statistics (admin only) |
| `audit-d1-sync` | ✅ | CF_* | Audit D1 sync status |
| `archive-cleanup` | ❌ | CF_*, RESEND_API_KEY | Clean expired archives (cron) |
| `dsar-submit` | ✅ | - | Data subject access requests |

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
- Device fingerprinting for suspicious login detection

### Authorization (RLS)
- All Supabase tables have RLS enabled
- Users can only access their own data
- Public journeys readable by approved followers
- Admin role checked via `has_role()` function

### Data Encryption
- API credentials encrypted at rest with ENCRYPTION_KEY
- D1 databases isolated per journey
- No cross-user data queries possible
- Media files in private buckets with signed URLs

### API Security
- All edge functions validate JWT (except public endpoints)
- Rate limiting on sync endpoints
- API tokens never exposed to frontend
- CORS headers on all responses

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

| Name | Schedule | Function | Purpose |
|------|----------|----------|---------|
| tessie-sync-hourly | `0 * * * *` | tessie-sync | Sync to Supabase |
| tessie-cloudflare-sync-hourly | `30 * * * *` | tessie-cloudflare-sync | Sync to D1 |
| archive-cleanup-daily | `0 3 * * *` | archive-cleanup | Clean expired archives |
| memory-reminder-daily | `0 20 * * *` | send-memory-reminder | Daily memory prompts |
| email-digest-daily | `0 8 * * *` | send-email-digest | Daily email digests |

---

## Environment Variables & Secrets

### Supabase Secrets (15 Configured)

| Name | Required By | Description |
|------|-------------|-------------|
| `TESSIE_API_KEY` | tessie, tessie-sync, tessie-cloudflare-sync | Platform Tessie key |
| `MAPBOX_TOKEN` | get-mapbox-token | Map rendering |
| `CLOUDFLARE_API_TOKEN` | journey-storage, tessie-cloudflare-sync | D1 management |
| `CLOUDFLARE_ACCOUNT_ID` | journey-storage, tessie-cloudflare-sync | CF account |
| `CLOUDFLARE_D1_DATABASE_ID` | tessie-cloudflare-sync | Flagship D1 |
| `RESEND_API_KEY` | send-email-digest, send-archive-reminder, send-memory-reminder | Email |
| `TWILIO_ACCOUNT_SID` | send-sms | SMS |
| `TWILIO_AUTH_TOKEN` | send-sms | SMS auth |
| `TWILIO_PHONE_NUMBER` | send-sms | SMS sender |
| `OPENAI_API_KEY` | voice-transcribe | Whisper transcription |
| `SPOTIFY_CLIENT_ID` | spotify-auth | Spotify OAuth |
| `SPOTIFY_CLIENT_SECRET` | spotify-auth | Spotify OAuth |
| `ENCRYPTION_KEY` | auth-security | Credential encryption |
| `WEATHER_API_KEY` | weather | Weather data |

### Frontend Environment Variables

| Name | Description |
|------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |
| `VITE_MAPBOX_TOKEN` | Public Mapbox token |

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
| `Rate limit exceeded` | Too many API calls | Implement backoff |

---

## Monitoring

### Edge Function Logs
Access via Supabase logs/edge function tooling.

### D1 Sync Status
Query `sync_log` table in each D1 database:
```sql
SELECT * FROM sync_log ORDER BY synced_at DESC LIMIT 10;
```

### Health Checks
- Vehicle API validation on credential save
- D1 connectivity check on provision
- Sync status in admin portal

---

## Self-Hosted GitHub Runner

### Configuration
- **Location**: `/Users/joe/actions-runner`
- **Platform**: macOS
- **Labels**: `self-hosted`

### Capabilities
- Node.js 20+ installed
- Deno 2.x installed for edge function validation
- Full npm/npx access

### CI/CD Workflow
The runner executes on push/PR to main:
1. Install dependencies (`npm ci`)
2. Run ESLint (`npm run lint`)
3. Type check (`npm run typecheck`)
4. Build application (`npm run build`)
5. Validate edge function syntax

### Setup Instructions
```bash
# Navigate to runner directory
cd /Users/joe/actions-runner

# Configure runner (if not already done)
./config.sh --url https://github.com/your-org/a-whittle-wandering --token YOUR_TOKEN

# Start runner
./run.sh
```

---

## Custom Hooks

### useAuth
Authentication state and methods:
```typescript
const { user, session, signIn, signOut, isAdmin, isLoading } = useAuth();
```

### useTessieData
Vehicle telemetry data:
```typescript
const { vehicleState, driveHistory, chargeHistory, isLoading } = useTessieData(vehicleId);
```

### useWeather
Weather for coordinates:
```typescript
const { weather, forecast, isLoading } = useWeather(lat, lng);
```

### useSignedUrl
Generate signed URLs for private media:
```typescript
const { signedUrl, isLoading } = useSignedUrl(filePath, bucket);
```

### useFlagshipWaypoints
Curated flagship journey waypoints:
```typescript
const { waypoints, isLoading } = useFlagshipWaypoints();
```

### useActivityLogger
Security audit logging:
```typescript
const { logActivity } = useActivityLogger();
await logActivity('journey_created', 'journey', journeyId);
```

---

## Component Organization

```
src/components/
├── ui/              # shadcn/ui primitives (42 components)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── admin/           # Admin-only (8 components)
│   ├── UserDetailDrawer.tsx
│   ├── SecurityDashboard.tsx
│   └── ...
├── journey/         # Journey features (13 components)
│   ├── JourneyList.tsx
│   ├── VoiceJournal.tsx
│   ├── UnifiedTripTimeline.tsx
│   └── ...
├── settings/        # User settings (9 components)
│   ├── AccountSettings.tsx
│   ├── PrivacySettings.tsx
│   └── ...
├── social/          # Social features (3 components)
│   ├── SocialShareButtons.tsx
│   ├── SpotifyConnect.tsx
│   └── ...
└── auth/            # Auth components (1 component)
    └── MFAVerification.tsx
```
