// Environment types for Cloudflare Workers
export interface Env {
  // D1 Database (platform registry - tracks all journeys)
  // Note: TESLA_DB is the canonical binding name in wrangler.toml
  // DB is an alias used by some modules for brevity
  TESLA_DB: D1Database;
  DB?: D1Database;  // Alias for TESLA_DB (some modules use this)
  
  // Cloudflare API credentials for resource provisioning
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
  
  // API Keys
  // Tessie uses bearer tokens; canonical name is TESSIE_API_TOKEN.
  // Back-compat: older deployments may still use TESSIE_API_KEY.
  TESSIE_API_TOKEN?: string;
  TESSIE_API_KEY?: string;
  MAPBOX_API_TOKEN?: string;
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
  
  // Cloudflare Services
  TELEMETRY_ANALYTICS?: AnalyticsEngineDataset;
  MEDIA_BUCKET?: R2Bucket;
  DATA_PROCESSOR?: Queue;
  
  // AI/ML (Future)
  AI?: any;
  AI_MODEL_NAME?: string;
}

// KV types
export interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' }): Promise<any>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

// Analytics Engine types
export interface AnalyticsEngineDataset {
  writeDataPoint(data: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }): void;
}

// R2 Storage types
export interface R2Bucket {
  list(options?: { limit?: number; prefix?: string }): Promise<R2Objects>;
  get(key: string): Promise<R2Object | null>;
  put(key: string, value: ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>;
  delete(key: string): Promise<void>;
}

export interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
}

export interface R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  checksums: Record<string, string>;
}

export interface R2PutOptions {
  httpMetadata?: Record<string, string>;
  customMetadata?: Record<string, string>;
}

// Queue types
export interface Queue {
  send(message: any, options?: { delay?: number }): Promise<void>;
}

// D1 Database types
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result<unknown>>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
}
