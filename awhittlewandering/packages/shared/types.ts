/**
 * Shared types for the A Whittle Wandering project
 */

// Cloudflare Worker Environment
export interface Env {
  // Binding services
  aww_api?: any;
  aww_browser?: any;
  aww_dispatch?: any;
  
  // KV Namespaces
  __STATIC_CONTENT?: KVNamespace;
  TRIP_DATA?: KVNamespace;
  
  // R2 Buckets
  STATIC_ASSETS?: R2Bucket;
  
  // Environment variables
  MAPBOX_TOKEN: string;
  APP_NAME: string;
  MAP_STYLE: string;
  ENABLE_STREAMING: string;
  ENABLE_MAP_PERFORMANCE_MONITORING: string;
  MAP_RETRY_ATTEMPTS: string;
  MAP_RETRY_DELAY: string;
  
  // API keys and secrets (will be set in actual deployments)
  TESSIE_API_KEY?: string;
  MCP_SERVER_KEY?: string;
  MCP_API_KEY?: string;
  OPENWEATHER_API_KEY?: string;
  AI_GATEWAY?: string;
  BROWSER?: any;
  DISPATCH?: any;
}

// Cloudflare Worker ExecutionContext
export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

// KV Asset Handler type augmentations
export interface CacheControl {
  browserTTL: number;
  edgeTTL: number;
  bypassCache: boolean;
}

export interface KVAssetOptions {
  request: Request;
  waitUntil: (promise: Promise<any>) => void;
  cacheControl?: CacheControl;
  mapRequestToAsset?: (request: Request) => Request;
  ASSET_NAMESPACE?: any;
  ASSET_MANIFEST?: any;
}

// Vehicle data types
export interface VehicleTelemetry {
  id: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  batteryLevel: number;
  charging: boolean;
  speed: number;
  stateCode?: string;
  address?: string;
  temperature?: number;
  weatherCondition?: string;
}

export interface TripDay {
  day: number;
  date: string;
  startLocation: string;
  endLocation: string;
  plannedMiles: number;
  actualMiles?: number;
  statesVisited: string[];
  highlights?: string[];
  telemetry?: VehicleTelemetry[];
  chargeStops?: ChargeStop[];
  photos?: Photo[];
}

export interface ChargeStop {
  id: string;
  name: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  durationMinutes: number;
  kWhAdded: number;
  startBatteryLevel: number;
  endBatteryLevel: number;
}

export interface Photo {
  id: string;
  url: string;
  timestamp: number;
  caption?: string;
  location?: string;
  tags?: string[];
}

// KVNamespace and R2Bucket type augmentations
declare global {
  interface KVNamespace {
    get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<any>;
    put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expiration?: number; expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string; expiration?: number }[]; list_complete: boolean; cursor?: string }>;
  }
  
  interface R2Bucket {
    get(key: string): Promise<R2Object | null>;
    put(key: string, value: ReadableStream | ArrayBuffer | string): Promise<R2Object>;
    delete(key: string): Promise<void>;
    list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<R2Objects>;
  }
  
  interface R2Object {
    key: string;
    size: number;
    etag: string;
    httpEtag: string;
    uploaded: Date;
    body: ReadableStream;
    writeHttpMetadata(headers: Headers): void;
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
    json<T>(): Promise<T>;
  }
  
  interface R2Objects {
    objects: R2Object[];
    truncated: boolean;
    cursor?: string;
  }
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface CurrentTripResponse {
  day: number;
  date: string;
  telemetry: VehicleTelemetry;
  progress: {
    daysCompleted: number;
    totalDays: number;
    statesVisited: number;
    totalStates: number;
    milesCompleted: number;
    totalMiles: number;
  };
}

export interface TripDayResponse extends TripDay {}

export interface TripSummaryResponse {
  startDate: string;
  endDate: string;
  totalDays: number;
  totalMiles: number;
  totalStates: number;
  totalChargeStops: number;
  currentDay: number;
  currentState: string;
  progress: number; // 0-100%
  highlights: {
    day: number;
    highlight: string;
    location: string;
  }[];
}
