/**
 * CRITICAL TESTS - Feature Flags Functionality
 * 
 * Tests to ensure feature flags work correctly for staged deployments.
 */

import { describe, it, expect } from 'vitest';
import { 
  getFeatureFlags, 
  isFeatureEnabled, 
  deploymentStages,
  getEnvironmentFeatureFlags
} from '../../packages/shared/featureFlags';

describe('CRITICAL: Feature Flags', () => {
  it('should return correct feature flags for production stage', () => {
    const flags = getFeatureFlags('user123', 'production');
    
    expect(flags.realTimeTracking).toBe(true);
    expect(flags.performanceMetrics).toBe(true);
    expect(flags).toHaveProperty('weatherOverlay');
    expect(flags).toHaveProperty('socialSharing');
  });

  it('should respect deployment stage percentages', () => {
    // Alpha stage should have limited features
    const alphaFlags = getFeatureFlags('user123', 'alpha');
    expect(alphaFlags.realTimeTracking).toBe(true);
    expect(alphaFlags.performanceMetrics).toBe(true);
    
    // Beta stage should have more features
    const betaFlags = getFeatureFlags('user123', 'beta');
    expect(betaFlags.realTimeTracking).toBe(true);
    expect(betaFlags.performanceMetrics).toBe(true);
  });

  it('should enable specific features correctly', () => {
    const isRealTimeEnabled = isFeatureEnabled('realTimeTracking', 'user123', 'production');
    expect(typeof isRealTimeEnabled).toBe('boolean');
    
    const isPerformanceEnabled = isFeatureEnabled('performanceMetrics', 'user123', 'production');
    expect(typeof isPerformanceEnabled).toBe('boolean');
  });

  it('should handle environment-specific overrides', () => {
    const devOverrides = getEnvironmentFeatureFlags('development');
    expect(devOverrides).toHaveProperty('experimentalUI');
    expect(devOverrides.experimentalUI).toBe(true);
    
    const stagingOverrides = getEnvironmentFeatureFlags('staging');
    expect(stagingOverrides).toHaveProperty('weatherOverlay');
    expect(stagingOverrides.weatherOverlay).toBe(true);
    
    const prodOverrides = getEnvironmentFeatureFlags('production');
    expect(typeof prodOverrides).toBe('object');
  });

  it('should ensure deployment stages are properly configured', () => {
    expect(deploymentStages.alpha.percentage).toBeLessThanOrEqual(100);
    expect(deploymentStages.beta.percentage).toBeLessThanOrEqual(100);
    expect(deploymentStages.production.percentage).toBe(100);
    
    expect(deploymentStages.alpha.enabledFeatures).toContain('realTimeTracking');
    expect(deploymentStages.production.enabledFeatures).toContain('realTimeTracking');
  });
});