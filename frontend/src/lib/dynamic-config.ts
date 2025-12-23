// Dynamic configuration service that fetches secure tokens from backend
import React from 'react';
import { api } from './api-config';
import { z } from 'zod';

const BackendConfigResponseSchema = z
  .object({
    // Token field names differ across implementations; accept either.
    mapboxAccessToken: z.string().nullable().optional(),
    mapboxToken: z.string().nullable().optional(),
    appName: z.string().optional(),
    apiVersion: z.string().optional()
  })
  .passthrough();

interface BackendConfig {
  mapboxAccessToken: string;
  appName: string;
  apiVersion: string;
}

class DynamicConfigService {
  private config: BackendConfig | null = null;
  private loading = false;
  private loadPromise: Promise<BackendConfig> | null = null;

  async getConfig(): Promise<BackendConfig> {
    // Return cached config if available
    if (this.config) {
      return this.config;
    }

    // Return existing promise if already loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Start loading config
    this.loading = true;
    this.loadPromise = this.fetchConfig();

    try {
      this.config = await this.loadPromise;
      this.loading = false;
      return this.config;
    } catch (error) {
      this.loading = false;
      this.loadPromise = null;
      throw error;
    }
  }

  private async fetchConfig(): Promise<BackendConfig> {
    try {
      const raw = await api.getConfig();
      const parsed = BackendConfigResponseSchema.safeParse(raw);
      if (!parsed.success) {
        console.error('Backend config response validation failed:', parsed.error);
        throw new Error('Invalid backend config response');
      }

      const token = parsed.data.mapboxAccessToken ?? parsed.data.mapboxToken ?? '';
      return {
        mapboxAccessToken: token,
        appName: parsed.data.appName ?? 'A Whittle Wandering',
        apiVersion: parsed.data.apiVersion ?? '3.0.0'
      };
    } catch (error) {
      console.error('Failed to fetch backend configuration:', error);
      
      // For development and fallback, provide a minimal config
      // In production, the backend should always be available
      return {
        mapboxAccessToken: '', // Will trigger the map setup UI if needed
        appName: 'A Whittle Wandering',
        apiVersion: '3.0.0'
      };
    }
  }

  async getMapboxToken(): Promise<string> {
    const config = await this.getConfig();
    return config.mapboxAccessToken;
  }

  clearCache() {
    this.config = null;
    this.loadPromise = null;
  }
}

// Export singleton instance
export const dynamicConfig = new DynamicConfigService();

// Hook for React components
export function useMapboxToken() {
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    dynamicConfig.getMapboxToken()
      .then(setToken)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { token, loading, error };
}
