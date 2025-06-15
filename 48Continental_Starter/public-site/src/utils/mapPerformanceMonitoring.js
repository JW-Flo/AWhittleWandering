/**
 * Map Performance Monitoring Module
 *
 * Provides utilities for tracking and reporting map performance metrics
 * in AWhittleWandering's interactive map component.
 *
 * @fileoverview ESLint is setup to not recognize browser globals by default
 * in many configs - we're adding explicit global references to address this.
 */

/* eslint-env browser */

// Performance thresholds in ms
const THRESHOLDS = {
  MAP_INIT: 1000,
  LAYER_ADD: 300,
  STYLE_CHANGE: 200,
  DATA_UPDATE: 150,
};

// Stores performance metrics for analysis
let performanceData = {
  mapInitTime: null,
  layerInitTime: null,
  styleChangeTimes: [],
  dataUpdateTimes: [],
  errorCount: 0,
  lastError: null,
};

/**
 * Records a performance timing event
 *
 * @param {string} metricName - The name of the metric to record
 * @param {number} duration - The duration in ms
 * @param {Object} context - Additional context for the metric
 * @returns {void}
 */
function recordMetric(metricName, duration, context = {}) {
  const timestamp = Date.now();
  const isSlowMetric = isSlowPerformance(metricName, duration);

  // Add to performance data store
  switch (metricName) {
    case "mapInit":
      performanceData.mapInitTime = duration;
      break;
    case "layerInit":
      performanceData.layerInitTime = duration;
      break;
    case "styleChange":
      performanceData.styleChangeTimes.push({ duration, timestamp, context });
      break;
    case "dataUpdate":
      performanceData.dataUpdateTimes.push({ duration, timestamp, context });
      break;
  }

  // Log to console
  console.log(
    `[Map Performance] ${metricName}: ${duration.toFixed(2)}ms ${
      isSlowMetric ? "(Slow)" : ""
    }`
  );

  // Report slow metrics for monitoring
  if (isSlowMetric && window.performance && window.performance.mark) {
    window.performance.mark(`map-slow-${metricName}-${timestamp}`);

    // You could also send to a monitoring service here
    if (window.navigator && navigator.sendBeacon) {
      try {
        const data = JSON.stringify({
          metricName,
          duration,
          timestamp,
          isSlowMetric,
          context,
          url: window.location.href,
        });
        navigator.sendBeacon("/api/performance-metric", data);
      } catch (e) {
        console.error(
          "[Map Performance] Failed to send performance beacon:",
          e
        );
      }
    }
  }
}

/**
 * Records an error that occurred in the map component
 *
 * @param {Error|string} error - The error object or message
 * @param {string} context - Context describing where the error occurred
 * @returns {void}
 */
function recordError(error, context) {
  performanceData.errorCount++;
  performanceData.lastError = {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : null,
    context,
    timestamp: Date.now(),
  };

  console.error(`[Map Performance] Error in ${context}:`, error);

  // You could also send to an error monitoring service here
}

/**
 * Determines if a performance metric is considered slow
 *
 * @param {string} metricName - The name of the metric
 * @param {number} duration - The duration in ms
 * @returns {boolean} True if the metric is considered slow
 */
function isSlowPerformance(metricName, duration) {
  const threshold = THRESHOLDS[metricName.toUpperCase()] || 500;
  return duration > threshold;
}

/**
 * Gets a summary of all recorded performance metrics
 *
 * @returns {Object} Performance metrics summary
 */
function getPerformanceSummary() {
  const averageStyleChange =
    performanceData.styleChangeTimes.length > 0
      ? performanceData.styleChangeTimes.reduce(
          (sum, item) => sum + item.duration,
          0
        ) / performanceData.styleChangeTimes.length
      : null;

  const averageDataUpdate =
    performanceData.dataUpdateTimes.length > 0
      ? performanceData.dataUpdateTimes.reduce(
          (sum, item) => sum + item.duration,
          0
        ) / performanceData.dataUpdateTimes.length
      : null;

  return {
    mapInitTime: performanceData.mapInitTime,
    layerInitTime: performanceData.layerInitTime,
    styleChanges: {
      count: performanceData.styleChangeTimes.length,
      averageDuration: averageStyleChange,
      slowestDuration:
        performanceData.styleChangeTimes.length > 0
          ? Math.max(
              ...performanceData.styleChangeTimes.map((item) => item.duration)
            )
          : null,
    },
    dataUpdates: {
      count: performanceData.dataUpdateTimes.length,
      averageDuration: averageDataUpdate,
      slowestDuration:
        performanceData.dataUpdateTimes.length > 0
          ? Math.max(
              ...performanceData.dataUpdateTimes.map((item) => item.duration)
            )
          : null,
    },
    errors: {
      count: performanceData.errorCount,
      lastError: performanceData.lastError,
    },
  };
}

/**
 * Resets all performance metrics
 *
 * @returns {void}
 */
function resetPerformanceMetrics() {
  performanceData = {
    mapInitTime: null,
    layerInitTime: null,
    styleChangeTimes: [],
    dataUpdateTimes: [],
    errorCount: 0,
    lastError: null,
  };
}

export {
  recordMetric,
  recordError,
  getPerformanceSummary,
  resetPerformanceMetrics,
};
