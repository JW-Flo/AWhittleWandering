/**
 * Vehicle telemetry monitoring service for the 48 Continental USA project.
 * This service monitors real-time vehicle telemetry data and ensures data
 * consistency across system components.
 *
 * @module VehicleTelemetryService
 */

import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import * as logger from "./utils/logger";
import { validateTelemetryPacket } from "./utils/validators";
import { MCPOperationQueue } from "./utils/mcpQueue";

/**
 * Configuration options for the VehicleTelemetryService
 * @typedef {Object} TelemetryServiceConfig
 * @property {string} vehicleId - Unique identifier for the vehicle
 * @property {number} pollInterval - Interval in ms between telemetry updates
 * @property {number} watchdogTimeout - Timeout in ms for watchdog timer
 * @property {number} maxRetries - Maximum number of retry attempts for failed operations
 * @property {number} retryDelay - Delay in ms between retry attempts
 * @property {string} mcpEndpoint - URI for the MCP server endpoint
 * @property {string} edgeEndpoint - URI for the edge infrastructure endpoint
 * @property {number} bufferSize - Maximum size of the local telemetry buffer
 * @property {boolean} enableOfflineMode - Whether to enable offline buffering mode
 */

/**
 * Structure of a telemetry packet from the vehicle
 * @typedef {Object} TelemetryPacket
 * @property {string} vehicleId - Unique identifier for the vehicle
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {Object} position - Geographic position of the vehicle
 * @property {number} position.lat - Latitude coordinate
 * @property {number} position.lng - Longitude coordinate
 * @property {number} [position.accuracy] - Position accuracy in meters (if available)
 * @property {Object} metrics - Various vehicle metrics
 * @property {number} metrics.batteryLevel - Current battery level percentage
 * @property {number} metrics.speed - Current speed in mph
 * @property {number} metrics.temperature - Current cabin temperature in °F
 */

/**
 * MCP operation interface
 * @typedef {Object} MCPOperation
 * @property {string} operation - Type of operation to perform
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {unknown} data - Operation data
 * @property {number} [retryCount] - Current retry attempt count
 * @property {number} [maxRetries] - Maximum number of retry attempts
 */

/**
 * Service state descriptor
 * @typedef {'disconnected'|'connecting'|'connected'|'offline'|'error'} ServiceState
 */

/**
 * Service for monitoring and processing vehicle telemetry data
 */
export class VehicleTelemetryService {
  /** @type {TelemetryServiceConfig} */
  #config;

  /** @type {EventEmitter} */
  #events;

  /** @type {TelemetryPacket[]} */
  #telemetryBuffer = [];

  /** @type {NodeJS.Timeout} */
  #watchdogTimer;

  /** @type {NodeJS.Timeout} */
  #pollTimer;

  /** @type {ServiceState} */
  #state = "disconnected";

  /** @type {MCPOperationQueue} */
  #mcpQueue;

  /** @type {number} */
  #lastTelemetryTimestamp = 0;

  /**
   * Creates a new VehicleTelemetryService instance
   *
   * @param {TelemetryServiceConfig} config - Configuration options
   */
  constructor(config) {
    // Validate required configuration
    if (!config.vehicleId) {
      throw new Error("Vehicle ID is required");
    }

    if (!config.mcpEndpoint) {
      throw new Error("MCP endpoint is required");
    }

    // Set default values for optional configuration
    this.#config = {
      pollInterval: 5000,
      watchdogTimeout: 30000,
      maxRetries: 5,
      retryDelay: 2000,
      bufferSize: 1000,
      enableOfflineMode: true,
      ...config,
    };

    this.#events = new EventEmitter();
    this.#mcpQueue = new MCPOperationQueue({
      endpoint: this.#config.mcpEndpoint,
      maxRetries: this.#config.maxRetries,
      retryDelay: this.#config.retryDelay,
    });

    // Increase max listener count to prevent memory leak warnings
    this.#events.setMaxListeners(50);

    logger.info({
      message: "Vehicle telemetry service initialized",
      vehicleId: this.#config.vehicleId,
      pollInterval: this.#config.pollInterval,
      watchdogTimeout: this.#config.watchdogTimeout,
    });
  }

  /**
   * Starts the telemetry monitoring service
   *
   * @returns {Promise<void>}
   */
  async start() {
    try {
      logger.info({
        message: "Starting vehicle telemetry service",
        vehicleId: this.#config.vehicleId,
      });

      this.#setState("connecting");

      // Initialize MCP connection
      await this.#initializeMCP();

      // Start the polling timer
      this.#startPolling();

      // Start the watchdog timer
      this.#startWatchdog();

      this.#setState("connected");

      this.#events.emit("started");

      logger.info({
        message: "Vehicle telemetry service started successfully",
        vehicleId: this.#config.vehicleId,
        state: this.#state,
      });
    } catch (error) {
      this.#handleStartError(error);
    }
  }

  /**
   * Stops the telemetry monitoring service
   *
   * @returns {Promise<void>}
   */
  async stop() {
    try {
      logger.info({
        message: "Stopping vehicle telemetry service",
        vehicleId: this.#config.vehicleId,
      });

      // Clear timers
      if (this.#pollTimer) {
        clearInterval(this.#pollTimer);
        this.#pollTimer = null;
      }

      if (this.#watchdogTimer) {
        clearTimeout(this.#watchdogTimer);
        this.#watchdogTimer = null;
      }

      // Process any remaining buffered telemetry
      if (this.#telemetryBuffer.length > 0) {
        await this.#processTelemetryBuffer();
      }

      this.#setState("disconnected");

      this.#events.emit("stopped");

      logger.info({
        message: "Vehicle telemetry service stopped successfully",
        vehicleId: this.#config.vehicleId,
      });
    } catch (error) {
      logger.error({
        message: "Error stopping vehicle telemetry service",
        vehicleId: this.#config.vehicleId,
        error: error.message,
        stack: error.stack,
      });

      throw error;
    }
  }

  /**
   * Registers an event handler
   *
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   * @returns {void}
   */
  on(event, handler) {
    this.#events.on(event, handler);
  }

  /**
   * Removes an event handler
   *
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function to remove
   * @returns {void}
   */
  off(event, handler) {
    this.#events.off(event, handler);
  }

  /**
   * Gets the current service state
   *
   * @returns {ServiceState} Current state
   */
  getState() {
    return this.#state;
  }

  /**
   * Gets the latest telemetry packet
   *
   * @returns {TelemetryPacket|null} Latest telemetry packet or null if none available
   */
  getLatestTelemetry() {
    return this.#telemetryBuffer.length > 0
      ? this.#telemetryBuffer[this.#telemetryBuffer.length - 1]
      : null;
  }

  /**
   * Forces an immediate telemetry update
   *
   * @returns {Promise<TelemetryPacket|null>} The latest telemetry packet or null on error
   */
  async forceUpdate() {
    try {
      logger.info({
        message: "Forcing telemetry update",
        vehicleId: this.#config.vehicleId,
      });

      const telemetry = await this.#fetchTelemetry();

      if (telemetry) {
        await this.#processTelemetryPacket(telemetry);
        return telemetry;
      }

      return null;
    } catch (error) {
      logger.error({
        message: "Error forcing telemetry update",
        vehicleId: this.#config.vehicleId,
        error: error.message,
        stack: error.stack,
      });

      return null;
    }
  }

  /**
   * Initializes the connection to the MCP server
   *
   * @private
   * @returns {Promise<void>}
   */
  async #initializeMCP() {
    const operation = {
      operation: "initialize",
      timestamp: Date.now(),
      data: {
        vehicleId: this.#config.vehicleId,
        clientId: uuidv4(),
      },
    };

    try {
      await this.#mcpQueue.enqueue(operation);

      logger.info({
        message: "MCP connection initialized",
        vehicleId: this.#config.vehicleId,
      });
    } catch (error) {
      logger.error({
        message: "Failed to initialize MCP connection",
        vehicleId: this.#config.vehicleId,
        error: error.message,
        stack: error.stack,
      });

      throw error;
    }
  }

  /**
   * Starts the telemetry polling timer
   *
   * @private
   * @returns {void}
   */
  #startPolling() {
    // Clear existing timer if it exists
    if (this.#pollTimer) {
      clearInterval(this.#pollTimer);
    }

    // Schedule the polling timer
    this.#pollTimer = setInterval(async () => {
      try {
        await this.#pollTelemetry();
      } catch (error) {
        logger.error({
          message: "Error during telemetry polling",
          vehicleId: this.#config.vehicleId,
          error: error.message,
          stack: error.stack,
          context: {
            state: this.#state,
            lastTelemetryTimestamp: this.#lastTelemetryTimestamp,
          },
        });
      }
    }, this.#config.pollInterval);

    logger.info({
      message: "Telemetry polling started",
      vehicleId: this.#config.vehicleId,
      pollInterval: this.#config.pollInterval,
    });
  }

  /**
   * Starts the watchdog timer to monitor for telemetry data interruptions
   *
   * @private
   * @returns {void}
   */
  #startWatchdog() {
    // Clear existing timer if it exists
    if (this.#watchdogTimer) {
      clearTimeout(this.#watchdogTimer);
    }

    // Schedule the watchdog timer
    this.#watchdogTimer = setTimeout(() => {
      this.#handleWatchdogTimeout();
    }, this.#config.watchdogTimeout);

    logger.info({
      message: "Watchdog timer started",
      vehicleId: this.#config.vehicleId,
      watchdogTimeout: this.#config.watchdogTimeout,
    });
  }

  /**
   * Resets the watchdog timer
   *
   * @private
   * @returns {void}
   */
  #resetWatchdog() {
    if (this.#watchdogTimer) {
      clearTimeout(this.#watchdogTimer);
    }

    this.#watchdogTimer = setTimeout(() => {
      this.#handleWatchdogTimeout();
    }, this.#config.watchdogTimeout);
  }

  /**
   * Handles a watchdog timeout event
   *
   * @private
   * @returns {void}
   */
  #handleWatchdogTimeout() {
    logger.warn({
      message: "Watchdog timeout: No telemetry updates received",
      vehicleId: this.#config.vehicleId,
      timeSinceLastUpdate: Date.now() - this.#lastTelemetryTimestamp,
      state: this.#state,
    });

    // Emit watchdog timeout event
    this.#events.emit("watchdogTimeout", {
      vehicleId: this.#config.vehicleId,
      lastTelemetryTimestamp: this.#lastTelemetryTimestamp,
      currentTimestamp: Date.now(),
    });

    // If we're connected, try to reconnect
    if (this.#state === "connected") {
      this.#handleConnectionIssue();
    }

    // Reset the watchdog timer
    this.#resetWatchdog();
  }

  /**
   * Sets the service state and emits a state change event
   *
   * @private
   * @param {ServiceState} newState - New service state
   * @returns {void}
   */
  #setState(newState) {
    if (this.#state !== newState) {
      const oldState = this.#state;
      this.#state = newState;

      logger.info({
        message: "Vehicle telemetry service state changed",
        vehicleId: this.#config.vehicleId,
        oldState,
        newState,
      });

      this.#events.emit("stateChanged", {
        oldState,
        newState,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Handles telemetry polling
   *
   * @private
   * @returns {Promise<void>}
   */
  async #pollTelemetry() {
    try {
      // If we're in offline mode, attempt to reconnect
      if (this.#state === "offline") {
        await this.#attemptReconnection();
      }

      // Don't poll if we're not in a valid state
      if (this.#state !== "connected") {
        return;
      }

      const telemetry = await this.#fetchTelemetry();

      if (telemetry) {
        await this.#processTelemetryPacket(telemetry);
      }
    } catch (error) {
      logger.error({
        message: "Error polling telemetry",
        vehicleId: this.#config.vehicleId,
        error: error.message,
        stack: error.stack,
        context: {
          state: this.#state,
          retryAttempt: 0,
        },
      });

      this.#handleConnectionIssue();
    }
  }

  /**
   * Fetches the latest telemetry data from the vehicle
   *
   * @private
   * @returns {Promise<TelemetryPacket|null>}
   */
  async #fetchTelemetry() {
    try {
      // In a real implementation, this would connect to the vehicle's API
      // For this example, we're simulating the API call
      const response = await axios.get(
        `${this.#config.mcpEndpoint}/vehicle/${
          this.#config.vehicleId
        }/telemetry`,
        {
          timeout: 5000,
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        }
      );

      if (response.status === 200 && response.data) {
        const telemetry = response.data;

        // Validate the telemetry packet
        if (!validateTelemetryPacket(telemetry)) {
          throw new Error("Invalid telemetry data received");
        }

        return telemetry;
      }

      logger.warn({
        message: "Failed to fetch telemetry data",
        vehicleId: this.#config.vehicleId,
        status: response.status,
      });

      return null;
    } catch (error) {
      // Throw a more specific error for network issues
      if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        throw new Error(`Network error fetching telemetry: ${error.code}`);
      }

      // Re-throw the original error
      throw error;
    }
  }

  /**
   * Processes a single telemetry packet
   *
   * @private
   * @param {TelemetryPacket} packet - Telemetry packet to process
   * @returns {Promise<void>}
   */
  async #processTelemetryPacket(packet) {
    try {
      // Update last telemetry timestamp
      this.#lastTelemetryTimestamp = packet.timestamp;

      // Reset watchdog timer since we received telemetry
      this.#resetWatchdog();

      // Add to buffer (respecting max buffer size)
      this.#addToBuffer(packet);

      // Report telemetry to MCP
      await this.#reportTelemetryToMCP(packet);

      // Report telemetry to Edge
      await this.#reportTelemetryToEdge(packet);

      // Emit telemetry update event
      this.#events.emit("telemetryUpdate", packet);

      logger.debug({
        message: "Telemetry packet processed",
        vehicleId: this.#config.vehicleId,
        timestamp: packet.timestamp,
        position: `${packet.position.lat},${packet.position.lng}`,
        batteryLevel: packet.metrics.batteryLevel,
      });

      // Ensure we're in connected state
      if (this.#state !== "connected") {
        this.#setState("connected");
      }
    } catch (error) {
      logger.error({
        message: "Error processing telemetry packet",
        vehicleId: this.#config.vehicleId,
        timestamp: packet.timestamp,
        error: error.message,
        stack: error.stack,
      });

      // Add to buffer anyway for later processing
      this.#addToBuffer(packet);
    }
  }

  /**
   * Processes the entire telemetry buffer
   *
   * @private
   * @returns {Promise<void>}
   */
  async #processTelemetryBuffer() {
    if (this.#telemetryBuffer.length === 0) {
      return;
    }

    logger.info({
      message: "Processing telemetry buffer",
      vehicleId: this.#config.vehicleId,
      bufferSize: this.#telemetryBuffer.length,
    });

    // Create a copy of the buffer
    const buffer = [...this.#telemetryBuffer];

    // Process each packet in the buffer
    const operations = buffer.map((packet) => ({
      operation: "reportTelemetry",
      timestamp: Date.now(),
      data: packet,
    }));

    try {
      // Process all operations in a batch
      await this.#mcpQueue.enqueueBatch(operations);

      // Clear the successfully processed packets
      this.#telemetryBuffer = this.#telemetryBuffer.filter(
        (packet) => !buffer.includes(packet)
      );

      logger.info({
        message: "Telemetry buffer processed successfully",
        vehicleId: this.#config.vehicleId,
        packetsProcessed: buffer.length,
        remainingBuffer: this.#telemetryBuffer.length,
      });
    } catch (error) {
      logger.error({
        message: "Error processing telemetry buffer",
        vehicleId: this.#config.vehicleId,
        error: error.message,
        stack: error.stack,
        packetsAttempted: buffer.length,
      });

      // Don't clear buffer, will retry later
    }
  }

  /**
   * Adds a telemetry packet to the buffer
   *
   * @private
   * @param {TelemetryPacket} packet - Telemetry packet to add
   * @returns {void}
   */
  #addToBuffer(packet) {
    // Add to buffer
    this.#telemetryBuffer.push(packet);

    // Trim buffer if it exceeds max size
    if (this.#telemetryBuffer.length > this.#config.bufferSize) {
      const overflow = this.#telemetryBuffer.length - this.#config.bufferSize;

      logger.warn({
        message: "Telemetry buffer overflow, discarding oldest entries",
        vehicleId: this.#config.vehicleId,
        overflow,
        bufferSize: this.#config.bufferSize,
      });

      this.#telemetryBuffer = this.#telemetryBuffer.slice(overflow);
    }
  }

  /**
   * Reports telemetry data to the MCP server
   *
   * @private
   * @param {TelemetryPacket} packet - Telemetry packet to report
   * @returns {Promise<void>}
   */
  async #reportTelemetryToMCP(packet) {
    const operation = {
      operation: "reportTelemetry",
      timestamp: Date.now(),
      data: packet,
    };

    try {
      await this.#mcpQueue.enqueue(operation);

      logger.debug({
        message: "Telemetry reported to MCP successfully",
        vehicleId: this.#config.vehicleId,
        timestamp: packet.timestamp,
      });
    } catch (error) {
      logger.error({
        message: "Failed to report telemetry to MCP",
        vehicleId: this.#config.vehicleId,
        error: error.message,
        stack: error.stack,
        operation: "reportTelemetry",
      });

      // Still consider this a success, we have the data in our buffer
      // The MCPOperationQueue will handle retries
    }
  }

  /**
   * Reports telemetry data to the Edge infrastructure
   *
   * @private
   * @param {TelemetryPacket} packet - Telemetry packet to report
   * @returns {Promise<void>}
   */
  async #reportTelemetryToEdge(packet) {
    if (!this.#config.edgeEndpoint) {
      return;
    }

    try {
      await axios.post(`${this.#config.edgeEndpoint}/telemetry`, packet, {
        timeout: 3000,
        headers: {
          "Content-Type": "application/json",
        },
      });

      logger.debug({
        message: "Telemetry reported to Edge successfully",
        vehicleId: this.#config.vehicleId,
        timestamp: packet.timestamp,
      });
    } catch (error) {
      logger.error({
        message: "Failed to report telemetry to Edge",
        vehicleId: this.#config.vehicleId,
        error: error.message,
        stack: error.stack,
      });

      // This is non-critical, so we won't retry or throw
      // Edge data is meant for real-time visualization, not critical storage
    }
  }

  /**
   * Handles connection issues
   *
   * @private
   * @returns {void}
   */
  #handleConnectionIssue() {
    if (this.#state === "offline") {
      return;
    }

    logger.warn({
      message: "Connection issue detected, switching to offline mode",
      vehicleId: this.#config.vehicleId,
      lastTelemetryTimestamp: this.#lastTelemetryTimestamp,
    });

    this.#setState("offline");

    this.#events.emit("connectionIssue", {
      vehicleId: this.#config.vehicleId,
      timestamp: Date.now(),
      lastTelemetryTimestamp: this.#lastTelemetryTimestamp,
    });
  }

  /**
   * Attempts to reconnect after a connection issue
   *
   * @private
   * @returns {Promise<void>}
   */
  async #attemptReconnection() {
    try {
      logger.info({
        message: "Attempting to reconnect",
        vehicleId: this.#config.vehicleId,
      });

      this.#setState("connecting");

      // Try to initialize MCP connection
      await this.#initializeMCP();

      // If we have buffered telemetry, process it
      if (this.#telemetryBuffer.length > 0) {
        await this.#processTelemetryBuffer();
      }

      // Reconnection successful
      this.#setState("connected");

      this.#events.emit("reconnected", {
        vehicleId: this.#config.vehicleId,
        timestamp: Date.now(),
        bufferSize: this.#telemetryBuffer.length,
      });

      logger.info({
        message: "Reconnection successful",
        vehicleId: this.#config.vehicleId,
      });
    } catch (error) {
      logger.error({
        message: "Reconnection attempt failed",
        vehicleId: this.#config.vehicleId,
        error: error.message,
        stack: error.stack,
      });

      // Stay in offline mode
      this.#setState("offline");
    }
  }

  /**
   * Handles errors during service startup
   *
   * @private
   * @param {Error} error - The error that occurred
   * @returns {void}
   */
  #handleStartError(error) {
    logger.error({
      message: "Error starting vehicle telemetry service",
      vehicleId: this.#config.vehicleId,
      error: error.message,
      stack: error.stack,
    });

    this.#setState("error");

    this.#events.emit("error", {
      type: "startupError",
      error,
      vehicleId: this.#config.vehicleId,
      timestamp: Date.now(),
    });

    throw error;
  }
}

/**
 * Creates and configures a VehicleTelemetryService instance
 *
 * @param {TelemetryServiceConfig} config - Configuration options
 * @returns {VehicleTelemetryService} Configured telemetry service
 */
export function createVehicleTelemetryService(config) {
  return new VehicleTelemetryService(config);
}
