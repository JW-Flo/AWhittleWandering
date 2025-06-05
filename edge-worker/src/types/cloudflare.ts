/**
 * Type definitions for Cloudflare Workers environment
 */

export interface D1Database {
  prepare<T = unknown>(query: string): D1PreparedStatement<T>;
}

export interface D1PreparedStatement<T = unknown> {
  bind(...values: unknown[]): D1PreparedStatement<T>;
  all<U = T>(): Promise<{ results: U[] }>;
  run(): Promise<{ changes: number }>;
  get<U = T>(): Promise<U | null>;
}

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  get(key: string, type: 'text'): Promise<string | null>;
  get(key: string, type: 'json'): Promise<unknown>;
  get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer | null>;
  get(key: string, type: 'stream'): Promise<ReadableStream | null>;
  put(key: string, value: string | ArrayBuffer | ReadableStream): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>;
}

export interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  idFromString(id: string): DurableObjectId;
  newUniqueId(): DurableObjectId;
}

export interface DurableObjectId {
  toString(): string;
}

export interface DurableObjectStub {
  fetch(request: Request): Promise<Response>;
}

export interface WorkerEnvironment {
  DB?: D1Database;
  TESLA_KV?: KVNamespace;
  APP_KV: KVNamespace;
  MAP_TILES_KV: KVNamespace;
  ITINERARY_KV: KVNamespace;
  EDGE_HMAC_KEY: string;
  TESLA_CLIENT_ID?: string;
  TESLA_CLIENT_SECRET?: string;
  TESSIE_API_TOKEN?: string;
  TESSIE_VIN?: string;
  SENDGRID_API_KEY?: string;
  FROM_EMAIL?: string;
  WEATHER_API_KEY?: string;
  ABRP_API_KEY?: string;
  MAPBOX_TOKEN?: string;
}
