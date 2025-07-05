/**
 * API Manager for 48 Continental
 * 
 * Resilient API access with circuit breaking, caching, and fallback strategies.
 * Designed to work with the Security Credential Manager for credential access.
 */

import { CredentialManager } from '../credential-manager';

export interface ApiClientOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
  cache?: boolean;
  cacheTtl?: number; // Time to live in seconds
}

export interface CircuitBreakerOptions {
  failureThreshold: number;     // Number of failures before opening
  resetTimeout: number;         // Time in ms before trying again
  halfOpenSuccess: number;      // Successes needed in half-open state to close
}

export interface CacheOptions {
  enabled: boolean;
  ttl: number;                  // Default time to live in seconds
  maxSize: number;              // Maximum number of cached responses
}

export type ApiState = 'HEALTHY' | 'DEGRADED' | 'FAILED';

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

export class CircuitBreaker {
  private failures: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private lastFailureTime: number = 0;
  private successesInHalfOpen: number = 0;

  constructor(private options: CircuitBreakerOptions) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isOpen(_endpoint: string): boolean {
    // If circuit is open, check if we should try again
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.options.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successesInHalfOpen = 0;
        return false;
      }
      return true;
    }
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canTest(_endpoint: string): boolean {
    return this.state === 'HALF_OPEN';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  recordSuccess(_endpoint: string): void {
    if (this.state === 'HALF_OPEN') {
      this.successesInHalfOpen++;
      if (this.successesInHalfOpen >= this.options.halfOpenSuccess) {
        this.state = 'CLOSED';
        this.failures = 0;
      }
    } else if (this.state === 'CLOSED') {
      this.failures = 0;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  recordFailure(_endpoint: string): void {
    this.lastFailureTime = Date.now();
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      return;
    }

    if (this.state === 'CLOSED') {
      this.failures++;
      if (this.failures >= this.options.failureThreshold) {
        this.state = 'OPEN';
      }
    }
  }

  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }
}

export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();

  constructor(private options: CacheOptions) {}

  async get<T>(key: string): Promise<T | null> {
    if (!this.options.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  async set(key: string, data: unknown, ttl?: number): Promise<void> {
    if (!this.options.enabled) return;

    // Ensure cache doesn't exceed max size
    if (this.cache.size >= this.options.maxSize) {
      // Delete oldest entry
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export class ApiClient {
  constructor(private options: ApiClientOptions) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(path, this.options.baseUrl);
    
    // Add query parameters
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // Merge headers
    const headers = {
      ...this.options.headers,
      ...options.headers,
      'Content-Type': 'application/json'
    };

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
      // Timeout not supported in standard fetch, would need a custom implementation
      signal: this.options.timeout ? AbortSignal.timeout(this.options.timeout) : undefined,
    };

    // Add body for non-GET requests
    if (options.body && fetchOptions.method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url.toString(), fetchOptions);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  async get<T>(path: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  async post<T>(path: string, data: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body: data });
  }

  async put<T>(path: string, data: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body: data });
  }

  async delete<T>(path: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export class ApiManager {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private cacheManager: CacheManager;
  private apiStates: Map<string, ApiState> = new Map();

  constructor(
    private credentialManager: CredentialManager,
    private defaultCircuitOptions: CircuitBreakerOptions = {
      failureThreshold: 3,
      resetTimeout: 30000,
      halfOpenSuccess: 2
    },
    private defaultCacheOptions: CacheOptions = {
      enabled: true,
      ttl: 300,
      maxSize: 1000
    }
  ) {
    this.cacheManager = new CacheManager(defaultCacheOptions);
  }

  private getCircuitBreaker(apiName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(apiName)) {
      this.circuitBreakers.set(apiName, new CircuitBreaker(this.defaultCircuitOptions));
    }
    return this.circuitBreakers.get(apiName)!;
  }

  private getCacheKey(apiName: string, endpoint: string, params?: Record<string, string>): string {
    const paramString = params ? Object.entries(params).sort().map(([k, v]) => `${k}=${v}`).join('&') : '';
    return `${apiName}:${endpoint}${paramString ? `?${paramString}` : ''}`;
  }

  async executeRequest<T>(
    apiName: string,
    client: ApiClient,
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(apiName);
    
    // Check if circuit is open
    if (circuitBreaker.isOpen(endpoint)) {
      if (circuitBreaker.canTest(endpoint)) {
        // Allow one test request through
        try {
          const result = await this.executeWithRetry<T>(client, endpoint, options);
          circuitBreaker.recordSuccess(endpoint);
          this.updateApiState(apiName, 'HEALTHY');
          return result;
        } catch (error) {
          circuitBreaker.recordFailure(endpoint);
          this.updateApiState(apiName, 'FAILED');
          throw error;
        }
      } else {
        // Circuit is open and not ready for testing
        throw new Error(`Circuit open for ${apiName} - ${endpoint}`);
      }
    }

    // Check cache if caching is enabled
    if (options.cache !== false && options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE') {
      const cacheKey = this.getCacheKey(apiName, endpoint, options.params);
      const cachedData = await this.cacheManager.get<T>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      // Execute request with retry logic
      const result = await this.executeWithRetry<T>(client, endpoint, options);
      
      // Update circuit breaker
      circuitBreaker.recordSuccess(endpoint);
      this.updateApiState(apiName, 'HEALTHY');
      
      // Cache result if caching is enabled
      if (options.cache !== false && options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE') {
        const cacheKey = this.getCacheKey(apiName, endpoint, options.params);
        await this.cacheManager.set(cacheKey, result, options.cacheTtl);
      }
      
      return result;
    } catch (error) {
      // Update circuit breaker
      circuitBreaker.recordFailure(endpoint);
      this.updateApiState(apiName, 'DEGRADED');
      
      throw error;
    }
  }

  private async executeWithRetry<T>(
    client: ApiClient,
    endpoint: string,
    options: RequestOptions,
    retries: number = 2
  ): Promise<T> {
    try {
      return await client.request<T>(endpoint, options);
    } catch (error) {
      if (retries <= 0) throw error;
      
      // Exponential backoff
      const delay = Math.pow(2, 3 - retries) * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.executeWithRetry<T>(client, endpoint, options, retries - 1);
    }
  }

  private updateApiState(apiName: string, state: ApiState): void {
    this.apiStates.set(apiName, state);
    // TODO: Report state change to monitoring system
  }

  getApiState(apiName: string): ApiState {
    return this.apiStates.get(apiName) || 'HEALTHY';
  }

  clearCache(): void {
    this.cacheManager.clear();
  }
}

// Specialized API clients will extend this class
export class TeslaApiClient {
  private client: ApiClient;
  private apiManager: ApiManager;
  private apiName = 'tesla';

  constructor(
    credentialManager: CredentialManager,
    private baseUrl = 'https://owner-api.teslamotors.com/api/1'
  ) {
    this.apiManager = new ApiManager(credentialManager, {
      failureThreshold: 3,
      resetTimeout: 60000,   // 1 minute for Tesla API
      halfOpenSuccess: 2
    });
    
    this.client = new ApiClient({
      baseUrl: this.baseUrl,
      timeout: 30000
    });
  }

  async getVehicles() {
    const apiKey = await this.getApiKey();
    const accessToken = await this.getAccessToken();
    
    return this.apiManager.executeRequest(
      this.apiName,
      this.client,
      '/vehicles',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Tesla-API-Key': apiKey
        },
        cache: true,
        cacheTtl: 60 // 1 minute cache for vehicle list
      }
    );
  }

  async getVehicleData(vehicleId: string) {
    const apiKey = await this.getApiKey();
    const accessToken = await this.getAccessToken();
    
    return this.apiManager.executeRequest(
      this.apiName,
      this.client,
      `/vehicles/${vehicleId}/data`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Tesla-API-Key': apiKey
        },
        cache: true,
        cacheTtl: 30 // 30 seconds cache for vehicle data
      }
    );
  }

  private async getApiKey(): Promise<string> {
    const apiKey = await this.apiManager['credentialManager'].getCredential('TESLA_API_KEY', 'critical');
    if (!apiKey) {
      throw new Error('Missing Tesla API key');
    }
    return apiKey;
  }

  private async getAccessToken(): Promise<string> {
    const accessToken = await this.apiManager['credentialManager'].getCredential('TESLA_ACCESS_TOKEN', 'critical');
    if (!accessToken) {
      throw new Error('Missing Tesla access token');
    }
    return accessToken;
  }
}
