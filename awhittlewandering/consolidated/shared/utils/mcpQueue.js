/**
 * MCP Operation Queue with retry capabilities
 *
 * This module provides a queue system for MCP operations with built-in retry logic,
 * error handling, and batch processing capabilities.
 *
 * @module MCPOperationQueue
 */

import axios from "axios";
import * as logger from "./logger";

/**
 * Configuration options for the MCP Operation Queue
 * @typedef {Object} MCPQueueConfig
 * @property {string} endpoint - The MCP server endpoint URL
 * @property {number} [maxRetries=5] - Maximum number of retry attempts
 * @property {number} [retryDelay=2000] - Delay between retry attempts in milliseconds
 * @property {number} [maxBatchSize=10] - Maximum number of operations in a batch
 * @property {number} [timeout=10000] - Request timeout in milliseconds
 */

/**
 * MCP operation structure
 * @typedef {Object} MCPOperation
 * @property {string} operation - Type of operation to perform
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {unknown} data - Operation data
 * @property {number} [retryCount] - Current retry attempt count
 * @property {number} [maxRetries] - Maximum number of retry attempts
 */

/**
 * Queue for MCP operations with retry logic
 */
export class MCPOperationQueue {
  /** @type {MCPQueueConfig} */
  #config;

  /** @type {MCPOperation[]} */
  #queue = [];

  /** @type {boolean} */
  #processing = false;

  /** @type {AbortController} */
  #abortController;

  /**
   * Creates a new MCPOperationQueue instance
   *
   * @param {MCPQueueConfig} config - Configuration options
   */
  constructor(config) {
    // Validate required configuration
    if (!config.endpoint) {
      throw new Error("MCP endpoint is required");
    }

    // Set default values for optional configuration
    this.#config = {
      maxRetries: 5,
      retryDelay: 2000,
      maxBatchSize: 10,
      timeout: 10000,
      ...config,
    };

    this.#abortController = new AbortController();

    logger.info({
      message: "MCPOperationQueue initialized",
      endpoint: this.#config.endpoint,
      maxRetries: this.#config.maxRetries,
      retryDelay: this.#config.retryDelay,
    });
  }

  /**
   * Adds an operation to the queue and processes it
   *
   * @param {MCPOperation} operation - The operation to enqueue
   * @returns {Promise<void>}
   */
  async enqueue(operation) {
    // Validate operation
    if (!operation.operation || !operation.timestamp) {
      throw new Error(
        "Invalid operation: must have operation type and timestamp"
      );
    }

    // Initialize retry count if not set
    if (operation.retryCount === undefined) {
      operation.retryCount = 0;
    }

    // Initialize max retries if not set
    if (operation.maxRetries === undefined) {
      operation.maxRetries = this.#config.maxRetries;
    }

    // Add to queue
    this.#queue.push(operation);

    logger.debug({
      message: "Operation enqueued",
      operation: operation.operation,
      timestamp: operation.timestamp,
      queueSize: this.#queue.length,
    });

    // Start processing if not already in progress
    if (!this.#processing) {
      await this.#processQueue();
    }
  }

  /**
   * Adds multiple operations to the queue and processes them
   *
   * @param {MCPOperation[]} operations - Array of operations to enqueue
   * @returns {Promise<void>}
   */
  async enqueueBatch(operations) {
    if (!Array.isArray(operations) || operations.length === 0) {
      return;
    }

    // Add each operation to the queue
    for (const operation of operations) {
      // Initialize retry count if not set
      if (operation.retryCount === undefined) {
        operation.retryCount = 0;
      }

      // Initialize max retries if not set
      if (operation.maxRetries === undefined) {
        operation.maxRetries = this.#config.maxRetries;
      }

      this.#queue.push(operation);
    }

    logger.debug({
      message: "Batch operations enqueued",
      batchSize: operations.length,
      queueSize: this.#queue.length,
    });

    // Start processing if not already in progress
    if (!this.#processing) {
      await this.#processQueue();
    }
  }

  /**
   * Returns the current size of the operation queue
   *
   * @returns {number} Current queue size
   */
  getQueueSize() {
    return this.#queue.length;
  }

  /**
   * Cancels all pending operations and resets the queue
   *
   * @returns {void}
   */
  cancelAll() {
    // Abort any ongoing requests
    this.#abortController.abort("Cancelled by user");
    this.#abortController = new AbortController();

    const cancelledCount = this.#queue.length;

    // Empty the queue
    this.#queue = [];
    this.#processing = false;

    logger.info({
      message: "All operations cancelled",
      cancelledOperations: cancelledCount,
    });
  }

  /**
   * Processes the operation queue
   *
   * @private
   * @returns {Promise<void>}
   */
  async #processQueue() {
    if (this.#processing || this.#queue.length === 0) {
      return;
    }

    this.#processing = true;

    try {
      while (this.#queue.length > 0) {
        // Process operations in batches up to maxBatchSize
        const batch = this.#queue.slice(0, this.#config.maxBatchSize);

        // Remove batch from queue
        this.#queue = this.#queue.slice(this.#config.maxBatchSize);

        // Try to process the batch
        await this.#processBatch(batch);
      }
    } catch (error) {
      logger.error({
        message: "Error processing operation queue",
        error: error.message,
        stack: error.stack,
        queueSize: this.#queue.length,
      });
    } finally {
      this.#processing = false;

      // If more operations were added during processing, process them
      if (this.#queue.length > 0) {
        // Small delay to prevent tight loop
        await new Promise((resolve) => setTimeout(resolve, 10));
        await this.#processQueue();
      }
    }
  }

  /**
   * Processes a batch of operations
   *
   * @private
   * @param {MCPOperation[]} batch - Batch of operations to process
   * @returns {Promise<void>}
   */
  async #processBatch(batch) {
    try {
      const response = await axios.post(
        `${this.#config.endpoint}/batch`,
        { operations: batch },
        {
          timeout: this.#config.timeout,
          headers: {
            "Content-Type": "application/json",
            "X-MCP-Batch": "true",
          },
          signal: this.#abortController.signal,
        }
      );

      if (response.status === 200 && response.data) {
        // Process results for each operation in the batch
        const results = response.data.results || [];

        // Check for failed operations that need to be retried
        const failedOperations = [];

        for (let i = 0; i < batch.length; i++) {
          const operation = batch[i];
          const result = i < results.length ? results[i] : { success: false };

          if (!result.success) {
            // Increment retry count
            operation.retryCount = (operation.retryCount || 0) + 1;

            // If under max retries, add back to queue
            if (operation.retryCount < operation.maxRetries) {
              failedOperations.push(operation);

              logger.warn({
                message: "Operation failed, will retry",
                operation: operation.operation,
                retryCount: operation.retryCount,
                maxRetries: operation.maxRetries,
              });
            } else {
              // Max retries reached, log error
              logger.error({
                message: "Operation failed after max retries",
                operation: operation.operation,
                maxRetries: operation.maxRetries,
              });
            }
          }
        }

        // If there are failed operations to retry, add them back to the queue
        if (failedOperations.length > 0) {
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, this.#config.retryDelay)
          );

          // Add back to the front of the queue
          this.#queue = [...failedOperations, ...this.#queue];

          logger.debug({
            message: "Failed operations added back to queue",
            failedCount: failedOperations.length,
            queueSize: this.#queue.length,
          });
        }

        logger.debug({
          message: "Batch processed",
          batchSize: batch.length,
          successCount: batch.length - failedOperations.length,
          failedCount: failedOperations.length,
          remainingQueue: this.#queue.length,
        });
      } else {
        // Entire batch failed, retry all operations
        this.#handleBatchError(
          new Error(`Batch request failed with status ${response.status}`),
          batch
        );
      }
    } catch (error) {
      // Handle network errors or other exceptions
      this.#handleBatchError(error, batch);
    }
  }

  /**
   * Handles an error during batch processing
   *
   * @private
   * @param {Error} error - The error that occurred
   * @param {MCPOperation[]} batch - The batch of operations that failed
   * @returns {Promise<void>}
   */
  async #handleBatchError(error, batch) {
    // If aborted, don't retry
    if (error.name === "AbortError") {
      logger.warn({
        message: "Batch processing aborted",
        batchSize: batch.length,
      });
      return;
    }

    logger.error({
      message: "Batch processing error",
      error: error.message,
      stack: error.stack,
      batchSize: batch.length,
    });

    // Increment retry count for each operation
    const operationsToRetry = [];

    for (const operation of batch) {
      operation.retryCount = (operation.retryCount || 0) + 1;

      if (operation.retryCount < operation.maxRetries) {
        operationsToRetry.push(operation);
      } else {
        logger.error({
          message: "Operation failed after max retries",
          operation: operation.operation,
          maxRetries: operation.maxRetries,
        });
      }
    }

    // If there are operations to retry, add them back to the queue
    if (operationsToRetry.length > 0) {
      // Wait before retrying
      await new Promise((resolve) =>
        setTimeout(resolve, this.#config.retryDelay)
      );

      // Add back to the front of the queue
      this.#queue = [...operationsToRetry, ...this.#queue];

      logger.debug({
        message: "Failed operations added back to queue after batch error",
        retryCount: operationsToRetry.length,
        queueSize: this.#queue.length,
      });
    }
  }
}

/**
 * Creates and configures an MCPOperationQueue instance
 *
 * @param {MCPQueueConfig} config - Configuration options
 * @returns {MCPOperationQueue} Configured operation queue
 */
export function createMCPOperationQueue(config) {
  return new MCPOperationQueue(config);
}
