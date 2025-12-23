// Environment types for Cloudflare Workers
export interface Env {
  // D1 Database (platform registry - tracks all journeys)
  TESLA_DB: D1Database;
  
  // Cloudflare API credentials for resource provisioning
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
  
  // API Keys
  TESSIE_API_KEY?: string;
  MAPBOX_API_TOKEN?: string;
  OPENWEATHER_API_KEY?: string;
  
  // Vehicle Configuration
  VEHICLE_ID?: string;
  TESLA_VIN?: string;
  
  // Admin Configuration
  ADMIN_TOKEN?: string;
  JWT_SECRET?: string;
  
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
