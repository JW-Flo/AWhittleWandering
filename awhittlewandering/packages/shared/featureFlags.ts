/**
 * Feature Flags for Incremental Deployments
 * 
 * This module provides feature flag functionality to enable staged rollouts
 * and gradual deployment of new features.
 */

export interface FeatureFlags {
  realTimeTracking: boolean;
  weatherOverlay: boolean;
  socialSharing: boolean;
  advancedAnalytics: boolean;
  experimentalUI: boolean;
  performanceMetrics: boolean;
}

export interface DeploymentStage {
  stage: 'alpha' | 'beta' | 'production';
  percentage: number;
  enabledFeatures: string[];
}

/**
 * Default feature flag configuration
 */
export const defaultFeatureFlags: FeatureFlags = {
  realTimeTracking: true,
  weatherOverlay: false,
  socialSharing: false,
  advancedAnalytics: false,
  experimentalUI: false,
  performanceMetrics: true,
};

/**
 * Deployment stage configurations
 */
export const deploymentStages: Record<string, DeploymentStage> = {
  alpha: {
    stage: 'alpha',
    percentage: 5,
    enabledFeatures: ['realTimeTracking', 'performanceMetrics']
  },
  beta: {
    stage: 'beta',
    percentage: 25,
    enabledFeatures: ['realTimeTracking', 'weatherOverlay', 'performanceMetrics']
  },
  production: {
    stage: 'production',
    percentage: 100,
    enabledFeatures: ['realTimeTracking', 'weatherOverlay', 'socialSharing', 'performanceMetrics']
  }
};

/**
 * Get feature flags for a user based on deployment stage
 */
export function getFeatureFlags(
  userId: string, 
  deploymentStage: keyof typeof deploymentStages = 'production'
): FeatureFlags {
  const stage = deploymentStages[deploymentStage];
  const userHash = hashUserId(userId);
  const userPercentile = userHash % 100;
  
  // Determine if user is in the rollout percentage
  const isUserInRollout = userPercentile < stage.percentage;
  
  if (!isUserInRollout) {
    // User is not in rollout, return safe defaults
    return {
      ...defaultFeatureFlags,
      weatherOverlay: false,
      socialSharing: false,
      advancedAnalytics: false,
      experimentalUI: false,
    };
  }
  
  // User is in rollout, enable stage-specific features
  const flags = { ...defaultFeatureFlags };
  
  // Enable features based on stage
  stage.enabledFeatures.forEach(feature => {
    if (feature in flags) {
      (flags as any)[feature] = true;
    }
  });
  
  return flags;
}

/**
 * Simple hash function for user ID
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Check if a specific feature is enabled for a user
 */
export function isFeatureEnabled(
  feature: keyof FeatureFlags,
  userId: string,
  deploymentStage: keyof typeof deploymentStages = 'production'
): boolean {
  const flags = getFeatureFlags(userId, deploymentStage);
  return flags[feature];
}

/**
 * Environment-based feature flag overrides
 */
export function getEnvironmentFeatureFlags(environment: string): Partial<FeatureFlags> {
  switch (environment) {
    case 'development':
      return {
        experimentalUI: true,
        advancedAnalytics: true,
      };
    case 'staging':
      return {
        weatherOverlay: true,
        socialSharing: true,
      };
    case 'production':
      return {};
    default:
      return {};
  }
}