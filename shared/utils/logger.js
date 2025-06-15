/**
 * Logging utility for 48 Continental USA project
 *
 * This module provides structured logging with appropriate levels, timestamps,
 * and context for all application components.
 *
 * @module logger
 */

/**
 * Log levels enum
 * @enum {string}
 */
export const LogLevel = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  FATAL: "fatal",
};

/**
 * Environment configuration for the logger
 * @typedef {Object} LoggerConfig
 * @property {LogLevel} level - Minimum log level to display
 * @property {boolean} enableConsole - Whether to log to console
 * @property {boolean} enableRemote - Whether to send logs to remote endpoint
 * @property {string} [remoteEndpoint] - URL for remote logging endpoint
 * @property {boolean} enableMetrics - Whether to include performance metrics
 * @property {boolean} prettify - Whether to prettify console output
 */

/** @type {LoggerConfig} */
const config = {
  level: process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === "production",
  remoteEndpoint: process.env.LOG_ENDPOINT,
  enableMetrics: process.env.NODE_ENV === "production",
  prettify: process.env.NODE_ENV !== "production",
};

/**
 * Numeric values for log levels (for comparison)
 * @type {Object.<string, number>}
 */
const LOG_LEVEL_VALUES = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4,
};

/**
 * Queue of logs to be sent to the remote endpoint
 * @type {Array<Object>}
 */
const logQueue = [];

/**
 * Whether a log flush is in progress
 * @type {boolean}
 */
let isFlushingLogs = false;

/**
 * Timestamp of the last log flush
 * @type {number}
 */
let lastFlushTime = 0;

/**
 * Timer for delayed log flushing
 * @type {NodeJS.Timeout}
 */
let flushTimer = null;

/**
 * Configures the logger
 *
 * @param {Partial<LoggerConfig>} options - Logger configuration options
 * @returns {void}
 */
export function configure(options) {
  Object.assign(config, options);

  // Log that configuration was updated
  debug({
    message: "Logger configuration updated",
    newConfig: {
      ...config,
      remoteEndpoint: config.remoteEndpoint ? "[REDACTED]" : undefined,
    },
  });
}

/**
 * Logs a debug message
 *
 * @param {Object|string} messageOrObject - Message string or object with message property
 * @param {Object} [context] - Additional context data
 * @returns {void}
 */
export function debug(messageOrObject, context = {}) {
  log(LogLevel.DEBUG, messageOrObject, context);
}

/**
 * Logs an info message
 *
 * @param {Object|string} messageOrObject - Message string or object with message property
 * @param {Object} [context] - Additional context data
 * @returns {void}
 */
export function info(messageOrObject, context = {}) {
  log(LogLevel.INFO, messageOrObject, context);
}

/**
 * Logs a warning message
 *
 * @param {Object|string} messageOrObject - Message string or object with message property
 * @param {Object} [context] - Additional context data
 * @returns {void}
 */
export function warn(messageOrObject, context = {}) {
  log(LogLevel.WARN, messageOrObject, context);
}

/**
 * Logs an error message
 *
 * @param {Object|string} messageOrObject - Message string or object with message property
 * @param {Object} [context] - Additional context data
 * @returns {void}
 */
export function error(messageOrObject, context = {}) {
  log(LogLevel.ERROR, messageOrObject, context);
}

/**
 * Logs a fatal error message
 *
 * @param {Object|string} messageOrObject - Message string or object with message property
 * @param {Object} [context] - Additional context data
 * @returns {void}
 */
export function fatal(messageOrObject, context = {}) {
  log(LogLevel.FATAL, messageOrObject, context);
}

/**
 * Core logging function
 *
 * @private
 * @param {LogLevel} level - Log level
 * @param {Object|string} messageOrObject - Message string or object with message property
 * @param {Object} [additionalContext] - Additional context data
 * @returns {void}
 */
function log(level, messageOrObject, additionalContext = {}) {
  // Check if we should log at this level
  if (LOG_LEVEL_VALUES[level] < LOG_LEVEL_VALUES[config.level]) {
    return;
  }

  // Create log entry
  const timestamp = new Date().toISOString();

  /** @type {Object} */
  let logData;

  // Handle string messages vs objects with message property
  if (typeof messageOrObject === "string") {
    logData = {
      level,
      timestamp,
      message: messageOrObject,
      ...additionalContext,
    };
  } else {
    logData = {
      level,
      timestamp,
      ...messageOrObject,
      ...additionalContext,
    };
  }

  // Include performance metrics if enabled
  if (config.enableMetrics) {
    try {
      const metrics = getPerformanceMetrics();
      logData.metrics = metrics;
    } catch (err) {
      // Ignore errors collecting metrics
    }
  }

  // Log to console if enabled
  if (config.enableConsole) {
    logToConsole(level, logData);
  }

  // Queue for remote logging if enabled
  if (config.enableRemote && config.remoteEndpoint) {
    logQueue.push(logData);
    scheduleLogFlush();
  }

  // Return the log data (useful for testing)
  return logData;
}

/**
 * Logs to the console with appropriate formatting
 *
 * @private
 * @param {LogLevel} level - Log level
 * @param {Object} logData - Log data
 * @returns {void}
 */
function logToConsole(level, logData) {
  const { timestamp, message } = logData;

  if (config.prettify) {
    // Pretty format for development
    const logMethods = {
      [LogLevel.DEBUG]: console.debug,
      [LogLevel.INFO]: console.info,
      [LogLevel.WARN]: console.warn,
      [LogLevel.ERROR]: console.error,
      [LogLevel.FATAL]: console.error,
    };

    // Remove timestamp and level from displayed object
    const displayData = { ...logData };
    delete displayData.timestamp;
    delete displayData.level;
    delete displayData.message;

    // Only log additional data if there are properties
    if (Object.keys(displayData).length > 0) {
      logMethods[level](
        `[${timestamp}] [${level.toUpperCase()}] ${message}`,
        displayData
      );
    } else {
      logMethods[level](`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }
  } else {
    // JSON format for production
    console.log(JSON.stringify(logData));
  }
}

/**
 * Schedules a log flush to the remote endpoint
 *
 * @private
 * @returns {void}
 */
function scheduleLogFlush() {
  // Don't schedule if already flushing or a flush is scheduled
  if (isFlushingLogs || flushTimer) {
    return;
  }

  // If enough time has passed since the last flush, flush immediately
  const now = Date.now();
  if (now - lastFlushTime > 5000) {
    flushLogs();
    return;
  }

  // Otherwise, schedule a flush in the future
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushLogs();
  }, 1000);
}

/**
 * Flushes queued logs to the remote endpoint
 *
 * @private
 * @returns {Promise<void>}
 */
async function flushLogs() {
  // Don't flush if already flushing or queue is empty
  if (isFlushingLogs || logQueue.length === 0) {
    return;
  }

  isFlushingLogs = true;
  lastFlushTime = Date.now();

  try {
    // Take logs from the queue
    const logsToSend = [...logQueue];
    logQueue.length = 0;

    // Send to remote endpoint
    const response = await fetch(config.remoteEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ logs: logsToSend }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to send logs: ${response.status} ${response.statusText}`
      );
    }
  } catch (err) {
    // If failed, log locally and add logs back to queue
    console.error("Failed to send logs to remote endpoint:", err);

    // Only keep the last 1000 logs to prevent memory issues
    const maxQueueSize = 1000;
    if (logQueue.length + logsToSend.length > maxQueueSize) {
      const overflow = logQueue.length + logsToSend.length - maxQueueSize;
      logsToSend.splice(0, overflow);
    }

    // Add back to queue
    logQueue.unshift(...logsToSend);
  } finally {
    isFlushingLogs = false;

    // If more logs were added while flushing, schedule another flush
    if (logQueue.length > 0) {
      scheduleLogFlush();
    }
  }
}

/**
 * Collects performance metrics
 *
 * @private
 * @returns {Object} Performance metrics
 */
function getPerformanceMetrics() {
  // In a browser environment
  if (typeof window !== "undefined" && window.performance) {
    const { memory, navigation, timing } = window.performance;

    return {
      memory: memory
        ? {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
          }
        : undefined,
      loadTime: timing
        ? timing.loadEventEnd - timing.navigationStart
        : undefined,
      domLoaded: timing
        ? timing.domContentLoadedEventEnd - timing.navigationStart
        : undefined,
    };
  }

  // In a Node.js environment
  if (typeof process !== "undefined") {
    const memoryUsage = process.memoryUsage();

    return {
      memory: {
        rss: memoryUsage.rss, // Resident Set Size
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
      uptime: process.uptime(),
    };
  }

  return {};
}

/**
 * Creates a child logger with additional context
 *
 * @param {Object} context - Context to include in all logs from this logger
 * @returns {Object} Child logger instance
 */
export function createChildLogger(context) {
  return {
    debug: (msgOrObj, additionalContext = {}) =>
      debug(msgOrObj, { ...context, ...additionalContext }),
    info: (msgOrObj, additionalContext = {}) =>
      info(msgOrObj, { ...context, ...additionalContext }),
    warn: (msgOrObj, additionalContext = {}) =>
      warn(msgOrObj, { ...context, ...additionalContext }),
    error: (msgOrObj, additionalContext = {}) =>
      error(msgOrObj, { ...context, ...additionalContext }),
    fatal: (msgOrObj, additionalContext = {}) =>
      fatal(msgOrObj, { ...context, ...additionalContext }),
    createChildLogger: (childContext) =>
      createChildLogger({ ...context, ...childContext }),
  };
}

/**
 * Initializes the logger with the given configuration
 *
 * @param {Partial<LoggerConfig>} options - Logger configuration options
 * @returns {Object} Logger instance
 */
export function initializeLogger(options = {}) {
  configure(options);

  info({
    message: "Logger initialized",
    level: config.level,
    enableConsole: config.enableConsole,
    enableRemote: config.enableRemote,
    enableMetrics: config.enableMetrics,
  });

  return {
    debug,
    info,
    warn,
    error,
    fatal,
    configure,
    createChildLogger,
  };
}
