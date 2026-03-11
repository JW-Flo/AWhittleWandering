// Auth user type (set by requireUser middleware)
export interface AuthUser {
  id: string;
  email?: string;
  admin?: boolean;
  mfa?: boolean;
  role?: string;
}

// Hono Variables type for c.get('user')
export interface Variables {
  user: AuthUser;
}

// Combined Hono context type for routers
export type AppContext = { Bindings: Env; Variables: Variables };

// Environment types for Cloudflare Workers
// Uses global types from @cloudflare/workers-types for D1Database, KVNamespace, R2Bucket, etc.
export interface Env {
  // D1 Database (platform registry - tracks all journeys)
  // Note: TESLA_DB is the canonical binding name in wrangler.toml
  // DB is an alias used by some modules for brevity - both point to same database
  TESLA_DB: D1Database;
  DB: D1Database;  // Alias for TESLA_DB (required - same binding)
  
  // Cloudflare API credentials for resource provisioning
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
  
  // API Keys
  // Tessie uses bearer tokens; canonical name is TESSIE_API_TOKEN.
  TESSIE_API_TOKEN?: string;
  MAPBOX_API_TOKEN?: string;
  MAPBOX_PUBLIC_TOKEN?: string; // pk.* public token safe for frontend exposure
  OPENWEATHER_API_KEY?: string;
  
  // Web Search APIs (fallback chain: Serper → Brave → Tavily → AI)
  SERPER_API_KEY?: string;      // serper.dev - 2,500 free/month
  BRAVE_API_KEY?: string;       // brave.com/search/api - 2,000 free/month
  TAVILY_API_KEY?: string;      // tavily.com - 1,000 free/month (optimized for AI)
  
  // Spotify Integration (optional)
  SPOTIFY_CLIENT_ID?: string;
  SPOTIFY_CLIENT_SECRET?: string;
  
  // Notification Webhooks (optional)
  NOTIFICATION_WEBHOOK?: string;
  
  // Vehicle Configuration
  VEHICLE_ID?: string;
  TESLA_VIN?: string;
  
  // Admin Configuration
  ADMIN_TOKEN?: string;
  ADMIN_TOKEN_PREVIOUS?: string;
  JWT_SECRET?: string;
  JWT_SECRET_PREVIOUS?: string;

  // User Auth + MFA + Push Notifications
  MFA_TOTP_ENCRYPTION_KEY?: string; // base64/base64url or raw string; used to encrypt TOTP secrets at rest
  VAPID_PUBLIC_KEY?: string;        // base64url
  VAPID_PRIVATE_KEY?: string;       // base64url
  PUSH_SUBJECT?: string;            // e.g. "mailto:support@awhittlewandering.com"
  OWNER_EMAIL?: string;             // defaults in code to joe@awhittlewandering.com if unset (not a secret)
  RECOVERY_CODE_PEPPER?: string;    // optional; if unset, uses MFA_TOTP_ENCRYPTION_KEY for hashing recovery codes

  // KV Namespace for auth/session challenge state
  AUTH_TOKENS?: KVNamespace;
  
  // Environment
  ENVIRONMENT?: string;
  LOG_LEVEL?: string;
  PLATFORM_MODE?: string;
  
  // Cloudflare Services
  TELEMETRY_ANALYTICS?: AnalyticsEngineDataset;
  MEDIA_BUCKET?: R2Bucket;
  DATA_PROCESSOR?: Queue;
  
  // AI/ML (Future)
  AI?: Ai;
  AI_MODEL_NAME?: string;
}
