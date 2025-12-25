import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dynamicConfig } from './dynamic-config';

describe('dynamicConfig.getMapboxToken', () => {
  beforeEach(() => {
    dynamicConfig.clearCache();
    vi.unstubAllGlobals();
  });

  it('reads token from backend `mapboxAccessToken`', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          appName: 'A Whittle Wandering',
          apiVersion: '3.0.0',
          mapboxAccessToken: 'pk.access-token'
        })
      })) as any
    );

    await expect(dynamicConfig.getMapboxToken()).resolves.toBe('pk.access-token');
  });

  it('falls back to backend legacy `mapboxToken`', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          appName: 'A Whittle Wandering',
          apiVersion: '3.0.0',
          mapboxToken: 'pk.legacy-token'
        })
      })) as any
    );

    await expect(dynamicConfig.getMapboxToken()).resolves.toBe('pk.legacy-token');
  });
});


