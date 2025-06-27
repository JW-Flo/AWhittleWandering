/**
 * POST-DEPLOYMENT VALIDATION TESTS
 * 
 * These tests run after deployment to validate the live system.
 * They don't block deployment but provide confidence in the deployment success.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock environment variables for testing
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'https://awhittlewandering.com';
const API_URL = process.env.API_URL || 'https://awhittlewandering-edge.workers.dev';

describe('POST-DEPLOY: Live System Validation', () => {
  // Increased timeout for network requests
  const networkTimeout = 10000;

  it('should validate main site is accessible', async () => {
    const response = await fetch(DEPLOYMENT_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(networkTimeout)
    });
    
    expect(response.status).toBe(200);
    
    const html = await response.text();
    expect(html).toContain('A Whittle Wandering');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  }, networkTimeout);

  it('should validate API health endpoint', async () => {
    const response = await fetch(`${API_URL}/healthz`, {
      method: 'GET',
      signal: AbortSignal.timeout(networkTimeout)
    });
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('healthy');
  }, networkTimeout);

  it('should validate API current trip endpoint', async () => {
    const response = await fetch(`${API_URL}/api/trip/current`, {
      method: 'GET',
      signal: AbortSignal.timeout(networkTimeout)
    });
    
    // Accept both 200 (data available) and 404 (no current trip) as valid
    expect([200, 404]).toContain(response.status);
    
    const data = await response.json();
    
    if (response.status === 200) {
      // If data is available, validate structure
      expect(data).toHaveProperty('day');
      expect(data).toHaveProperty('telemetry');
    } else {
      // If no data, should have error message
      expect(data).toHaveProperty('error');
    }
  }, networkTimeout);

  it('should validate CORS headers are present', async () => {
    const response = await fetch(`${API_URL}/api/trip/current`, {
      method: 'OPTIONS',
      signal: AbortSignal.timeout(networkTimeout)
    });
    
    expect(response.headers.has('access-control-allow-origin')).toBe(true);
    expect(response.headers.has('access-control-allow-methods')).toBe(true);
  }, networkTimeout);

  it('should validate security headers', async () => {
    const response = await fetch(DEPLOYMENT_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(networkTimeout)
    });
    
    // Check for common security headers
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];
    
    let securityHeaderCount = 0;
    securityHeaders.forEach(header => {
      if (response.headers.has(header)) {
        securityHeaderCount++;
      }
    });
    
    // Expect at least some security headers to be present
    expect(securityHeaderCount).toBeGreaterThan(0);
  }, networkTimeout);

  it('should validate page load performance', async () => {
    const startTime = Date.now();
    
    const response = await fetch(DEPLOYMENT_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(networkTimeout)
    });
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    expect(response.status).toBe(200);
    // Page should load within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000);
  }, networkTimeout);
});

describe('POST-DEPLOY: Feature Flag Validation', () => {
  it('should validate feature flags are working in production', async () => {
    // This would typically make a request to an endpoint that returns feature flag status
    // For now, we'll just verify the concept works
    const mockUserId = 'test-user-' + Date.now();
    
    // Import here to avoid issues with module loading in tests
    const { getFeatureFlags } = await import('../../packages/shared/featureFlags');
    
    const flags = getFeatureFlags(mockUserId, 'production');
    
    expect(flags).toHaveProperty('realTimeTracking');
    expect(flags).toHaveProperty('performanceMetrics');
    expect(flags.realTimeTracking).toBe(true);
    expect(flags.performanceMetrics).toBe(true);
  });
});