// Dynamic configuration service that fetches secure tokens from backend
import React from 'react';
import { api } from './api-config';

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
      const config = await api.getConfig() as BackendConfig;
      return config;
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
