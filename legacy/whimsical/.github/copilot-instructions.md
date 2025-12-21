# GitHub Copilot Instructions for A Whittle Wandering (AWW)

## Project Overview

AWW is an EV road trip tracking platform built with React 19 + Vite + TypeScript. It uses Lovable Cloud (Supabase) for backend services and Cloudflare D1 for compartmentalized per-journey telemetry storage.

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **State**: TanStack Query (React Query) for server state
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Telemetry Storage**: Cloudflare D1 (one database per journey)
- **Maps**: Mapbox GL JS
- **Forms**: React Hook Form + Zod validation

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── admin/        # Admin-only components (UserDetailDrawer, SecurityDashboard)
│   ├── journey/      # Journey-related (JourneyList, VoiceJournal, UnifiedTripTimeline)
│   ├── settings/     # User settings (AccountSettings, PrivacySettings)
│   ├── social/       # Social features (SocialShareButtons, SpotifyConnect)
│   └── auth/         # Auth components (MFAVerification)
├── hooks/            # Custom hooks (useAuth, useTessieData, useWeather)
├── pages/            # Route pages (Dashboard, Admin, Settings)
├── lib/              # Utilities (utils, htmlSanitizer, passwordSecurity)
├── integrations/     # Supabase client & types (DO NOT EDIT types.ts)
└── data/             # Static data (journeyRoute)

supabase/
├── functions/        # 28 Edge Functions (Deno)
├── migrations/       # 53 SQL migrations
└── config.toml       # Supabase configuration (DO NOT EDIT)
```

## Database Schema (35 Tables)

### Core Tables
- `journeys` - User road trips with D1 database references
- `vehicles` - User vehicles with API provider links
- `user_api_credentials` - Encrypted API tokens (Tessie, Fleet, Smartcar)
- `drive_data` - GPS telemetry points
- `charging_sessions` - EV charging events
- `states_visited` - State crossing records

### User & Auth
- `profiles` - User profile data with privacy settings
- `user_roles` - Role assignments (admin, user, premium)
- `beta_testers` - Beta access codes
- `trusted_devices` - Device fingerprints for security
- `login_attempts` - Auth attempt logging
- `login_alerts` - Suspicious login notifications
- `account_lockouts` - Brute-force protection

### Journey Features
- `journal_entries` - Text/voice journal entries
- `journey_media` - Photos/videos with location privacy
- `journey_tracks` - Spotify listening history
- `journey_followers` - Follow relationships
- `journey_notification_settings` - Per-journey notification prefs
- `flagship_waypoints` - Curated waypoints for flagship journey

### Notifications
- `notification_preferences` - User notification settings
- `notification_queue` - Pending notifications
- `sms_consent_log` - TCPA compliance records

### Admin & Security
- `security_audit_log` - Security event logging
- `security_scan_results` - Automated security scans
- `incident_log` - Security incidents
- `page_views` - Analytics
- `blocked_visitors` - Blocked IPs/visitors
- `data_retention_config` - Retention policy settings

## Edge Functions (28 Total)

### Authentication & Security
| Function | JWT | Purpose |
|----------|-----|---------|
| `auth-security` | ✅ | Login security checks, device fingerprinting |
| `beta-auth` | ❌ | Beta access code validation |
| `security-audit` | ✅ | Security scanning and audit logging |
| `incident-remediation` | ✅ | Security incident response |

### Vehicle & Data Sync
| Function | JWT | Purpose |
|----------|-----|---------|
| `tessie` | ✅ | Direct Tessie API proxy |
| `tessie-sync` | ✅ | Sync vehicle data to Supabase |
| `tessie-cloudflare-sync` | ✅ | Sync vehicle data to Cloudflare D1 |
| `vehicle-api` | ✅ | Multi-provider vehicle API proxy |
| `extract-waypoints` | ✅ | Parse waypoints from GPS telemetry |

### Journey Management
| Function | JWT | Purpose |
|----------|-----|---------|
| `journey-storage` | ✅ | D1 database provisioning & management |
| `route-navigator` | ✅ | Route calculation and navigation |
| `csv-import` | ✅ | Import telemetry from CSV files |
| `generate-test-journey` | ✅ | Create test journey data |

### Notifications
| Function | JWT | Purpose |
|----------|-----|---------|
| `send-sms` | ✅ | Twilio SMS dispatch |
| `send-email-digest` | ❌ | Resend email digests (cron) |
| `send-memory-reminder` | ❌ | Daily memory prompts (cron) |
| `send-archive-reminder` | ❌ | Archive expiry warnings (cron) |

### Integrations
| Function | JWT | Purpose |
|----------|-----|---------|
| `spotify-auth` | ✅ | Spotify OAuth flow |
| `weather` | ✅ | Weather data for locations |
| `get-mapbox-token` | ✅ | Secure Mapbox token delivery |
| `voice-transcribe` | ✅ | OpenAI Whisper transcription |

### Media & Storage
| Function | JWT | Purpose |
|----------|-----|---------|
| `signed-url` | ✅ | Generate signed URLs for private media |
| `track-view` | ❌ | Anonymous page view tracking |

### Admin
| Function | JWT | Purpose |
|----------|-----|---------|
| `admin-users` | ✅ | User management (admin only) |
| `d1-stats` | ✅ | D1 database statistics (admin only) |
| `audit-d1-sync` | ✅ | Audit D1 sync status |
| `archive-cleanup` | ❌ | Clean expired archives (cron) |
| `dsar-submit` | ✅ | Data subject access requests |

## Key Hooks

```typescript
// Authentication
import { useAuth } from '@/hooks/useAuth';
const { user, session, signIn, signOut, isAdmin } = useAuth();

// Vehicle data
import { useTessieData } from '@/hooks/useTessieData';
const { vehicleState, driveHistory, isLoading } = useTessieData(vehicleId);

// Weather
import { useWeather } from '@/hooks/useWeather';
const { weather, isLoading } = useWeather(lat, lng);

// Signed URLs for private media
import { useSignedUrl } from '@/hooks/useSignedUrl';
const { signedUrl } = useSignedUrl(filePath, bucket);

// Flagship waypoints
import { useFlagshipWaypoints } from '@/hooks/useFlagshipWaypoints';
const { waypoints, isLoading } = useFlagshipWaypoints();

// Activity logging
import { useActivityLogger } from '@/hooks/useActivityLogger';
const { logActivity } = useActivityLogger();
```

## RLS Policy Patterns

All tables have Row Level Security enabled. Common patterns:

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data"
ON table_name FOR SELECT
USING (auth.uid() = user_id);

-- Admin access
CREATE POLICY "Admins can view all"
ON table_name FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public journey data (with approved followers)
CREATE POLICY "Users can view accessible data"
ON table_name FOR SELECT
USING (
  user_id = auth.uid() OR 
  (is_journey_public(journey_id) AND is_approved_follower(journey_id, auth.uid()))
);
```

## Secrets Configuration (15 Configured)

| Secret | Required By |
|--------|-------------|
| `TESSIE_API_KEY` | tessie, tessie-sync, tessie-cloudflare-sync |
| `MAPBOX_TOKEN` | get-mapbox-token |
| `CLOUDFLARE_API_TOKEN` | journey-storage, tessie-cloudflare-sync |
| `CLOUDFLARE_ACCOUNT_ID` | journey-storage, tessie-cloudflare-sync |
| `CLOUDFLARE_D1_DATABASE_ID` | tessie-cloudflare-sync |
| `RESEND_API_KEY` | send-email-digest, send-archive-reminder |
| `TWILIO_ACCOUNT_SID` | send-sms |
| `TWILIO_AUTH_TOKEN` | send-sms |
| `TWILIO_PHONE_NUMBER` | send-sms |
| `OPENAI_API_KEY` | voice-transcribe |
| `SPOTIFY_CLIENT_ID` | spotify-auth |
| `SPOTIFY_CLIENT_SECRET` | spotify-auth |
| `ENCRYPTION_KEY` | auth-security (credential encryption) |

## Code Style Guidelines

### Imports
```typescript
// Always use path aliases
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
```

### Component Structure
```typescript
// 1. Imports
// 2. Types/Interfaces
// 3. Component
// 4. Export

interface Props {
  journeyId: string;
  onComplete?: () => void;
}

export const MyComponent = ({ journeyId, onComplete }: Props) => {
  // State
  // Effects
  // Handlers
  // Render
};
```

### Styling
- Use Tailwind CSS utility classes
- Use semantic tokens from design system (never raw colors)
- Use `cn()` for conditional classes
- Components should be responsive by default

### Data Fetching
```typescript
// Prefer TanStack Query for server state
const { data, isLoading, error } = useQuery({
  queryKey: ['journeys', userId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('journeys')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },
});
```

### Edge Functions
```typescript
// Standard edge function structure
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !user) throw new Error('Invalid token');

    // Function logic here...

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

## Testing Considerations

- E2E test scenarios documented in `docs/E2E_TEST_SCENARIOS.md`
- Focus on critical paths: auth, journey creation, data sync
- Test RLS policies with different user contexts
- Validate edge functions with mock requests

## Common Pitfalls

1. **Never edit `src/integrations/supabase/types.ts`** - Auto-generated
2. **Never edit `supabase/config.toml`** - Managed by Lovable
3. **Never edit `.env`** - Managed by Lovable Cloud
4. **Always check RLS policies** when adding new tables
5. **Use `auth.uid()` in RLS**, not session data
6. **Encrypt sensitive data** before storing (API tokens)
7. **Add CORS headers** to all edge function responses

## Recent Features

- **Voice Journal**: Record voice memos with OpenAI Whisper transcription
- **Memory Prompts**: Smart nudges based on GPS dwell time
- **Unified Trip Timeline**: Chronological view of all journey events
- **Spotify Integration**: Track listening history during drives
- **SMS Notifications**: TCPA-compliant SMS alerts via Twilio
