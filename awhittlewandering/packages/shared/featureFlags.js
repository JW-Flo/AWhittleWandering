/**
 * Feature Flags for Incremental Deployments
 *
 * This module provides feature flag functionality to enable staged rollouts
 * and gradual deployment of new features.
 */
/**
 * Default feature flag configuration
 */
export const defaultFeatureFlags = {
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
export const deploymentStages = {
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
export function getFeatureFlags(userId, deploymentStage = 'production') {
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
            flags[feature] = true;
        }
    });
    return flags;
}
/**
 * Simple hash function for user ID
 */
function hashUserId(userId) {
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
export function isFeatureEnabled(feature, userId, deploymentStage = 'production') {
    const flags = getFeatureFlags(userId, deploymentStage);
    return flags[feature];
}
/**
 * Environment-based feature flag overrides
 */
export function getEnvironmentFeatureFlags(environment) {
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
