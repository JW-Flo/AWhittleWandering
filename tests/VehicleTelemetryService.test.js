/**
 * Vehicle Telemetry Service Tests
 *
 * This test suite validates the functionality of the vehicle telemetry service,
 * including real-time data handling, error conditions, and reconnection logic.
 */

import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { rest } from "msw";
import { setupServer } from "msw/node";
import axios from "axios";
import { VehicleTelemetryService } from "../shared/services/VehicleTelemetryService";
import * as logger from "../shared/utils/logger";

// Mock dependencies
vi.mock("../shared/utils/logger", () => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
}));

// Create MSW server for API mocking
const server = setupServer();

describe("VehicleTelemetryService", () => {
  // Sample config for testing
  const testConfig = {
    vehicleId: "TEST-VEHICLE-001",
    mcpEndpoint: "http://localhost:8080/api/mcp",
    edgeEndpoint: "http://localhost:8080/api/edge",
    pollInterval: 100, // Shorter interval for tests
    watchdogTimeout: 500, // Shorter timeout for tests
    maxRetries: 2,
    retryDelay: 100,
    bufferSize: 10,
    enableOfflineMode: true,
  };

  // Sample telemetry packet for testing
  const testTelemetryPacket = {
    vehicleId: "TEST-VEHICLE-001",
    timestamp: Date.now(),
    position: {
      lat: 40.7128,
      lng: -74.006,
      accuracy: 5.0,
    },
    metrics: {
      batteryLevel: 80.5,
      speed: 65.0,
      temperature: 72.0,
    },
  };

  // Create a telemetry service for testing
  let telemetryService;

  // Setup MSW handlers before each test
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Setup global APIs
    global.AbortController = class AbortController {
      constructor() {
        this.signal = { aborted: false };
      }
      abort() {
        this.signal.aborted = true;
      }
    };

    global.setTimeout = vi.fn((cb, delay) => {
      const id = setTimeout(cb, delay);
      return id;
    });

    global.clearTimeout = vi.fn((id) => {
      clearTimeout(id);
    });

    global.setInterval = vi.fn((cb, delay) => {
      const id = setInterval(cb, delay);
      return id;
    });

    global.clearInterval = vi.fn((id) => {
      clearInterval(id);
    });

    // Setup MSW handlers
    server.use(
      rest.get(
        `${testConfig.mcpEndpoint}/vehicle/:vehicleId/telemetry`,
        (req, res, ctx) => {
          return res(ctx.json(testTelemetryPacket));
        }
      ),

      rest.post(`${testConfig.mcpEndpoint}/batch`, (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            results: req.body.operations.map(() => ({ success: true })),
          })
        );
      }),

      rest.post(`${testConfig.edgeEndpoint}/telemetry`, (req, res, ctx) => {
        return res(ctx.json({ success: true }));
      })
    );

    // Start MSW server
    server.listen();

    // Create a fresh telemetry service for each test
    telemetryService = new VehicleTelemetryService(testConfig);
  });

  // Clean up after each test
  afterEach(async () => {
    // Stop any running service
    if (telemetryService) {
      try {
        await telemetryService.stop();
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    // Reset MSW handlers
    server.resetHandlers();
  });

  // Clean up after all tests
  afterAll(() => {
    server.close();
  });

  /**
   * Test: Constructor validates required configuration
   */
  it("should validate required configuration in constructor", () => {
    // Should throw if vehicleId is missing
    expect(
      () =>
        new VehicleTelemetryService({
          ...testConfig,
          vehicleId: undefined,
        })
    ).toThrow("Vehicle ID is required");

    // Should throw if MCP endpoint is missing
    expect(
      () =>
        new VehicleTelemetryService({
          ...testConfig,
          mcpEndpoint: undefined,
        })
    ).toThrow("MCP endpoint is required");

    // Should not throw with valid config
    expect(() => new VehicleTelemetryService(testConfig)).not.toThrow();
  });

  /**
   * Test: Start method initializes correctly
   */
  it("should initialize and start correctly", async () => {
    // Setup event listener for when service is started
    const startPromise = new Promise((resolve) => {
      telemetryService.on("started", resolve);
    });

    // Start the service
    await telemetryService.start();

    // Wait for started event
    await startPromise;

    // Validate state
    expect(telemetryService.getState()).toBe("connected");

    // Validate logger was called
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Vehicle telemetry service started successfully",
        vehicleId: testConfig.vehicleId,
      })
    );
  });

  /**
   * Test: Polling retrieves and processes telemetry
   */
  it("should poll for telemetry data", async () => {
    // Setup spy on telemetry update event
    const telemetryUpdateSpy = vi.fn();
    telemetryService.on("telemetryUpdate", telemetryUpdateSpy);

    // Start the service
    await telemetryService.start();

    // Wait for polling to occur (poll interval + buffer)
    await new Promise((resolve) =>
      setTimeout(resolve, testConfig.pollInterval + 50)
    );

    // Verify telemetry update event was fired
    expect(telemetryUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        vehicleId: testConfig.vehicleId,
        position: expect.objectContaining({
          lat: expect.any(Number),
          lng: expect.any(Number),
        }),
      })
    );

    // Verify latest telemetry is available
    const latestTelemetry = telemetryService.getLatestTelemetry();
    expect(latestTelemetry).toEqual(
      expect.objectContaining({
        vehicleId: testConfig.vehicleId,
      })
    );
  });

  /**
   * Test: Handle connection failures
   */
  it("should handle connection failures and switch to offline mode", async () => {
    // Setup state change listener
    const stateChanges = [];
    telemetryService.on("stateChanged", ({ newState }) => {
      stateChanges.push(newState);
    });

    // Start the service
    await telemetryService.start();

    // Override the handler to simulate a connection failure
    server.use(
      rest.get(
        `${testConfig.mcpEndpoint}/vehicle/:vehicleId/telemetry`,
        (req, res, ctx) => {
          return res(ctx.status(500));
        }
      )
    );

    // Wait for polling to occur and detect the failure
    await new Promise((resolve) =>
      setTimeout(resolve, testConfig.pollInterval + 100)
    );

    // Verify service switched to offline mode
    expect(stateChanges).toContain("offline");
    expect(telemetryService.getState()).toBe("offline");

    // Verify error was logged
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Error polling telemetry"),
      })
    );
  });

  /**
   * Test: Automatic reconnection
   */
  it("should attempt to reconnect after connection failure", async () => {
    // Start with a simulated failure
    server.use(
      rest.get(
        `${testConfig.mcpEndpoint}/vehicle/:vehicleId/telemetry`,
        (req, res, ctx) => {
          return res(ctx.status(500));
        }
      )
    );

    // Setup reconnection listener
    const reconnectedSpy = vi.fn();
    telemetryService.on("reconnected", reconnectedSpy);

    // Start the service
    await telemetryService.start();

    // Wait for the service to detect the failure and go offline
    await new Promise((resolve) =>
      setTimeout(resolve, testConfig.pollInterval + 100)
    );
    expect(telemetryService.getState()).toBe("offline");

    // Restore the working handler
    server.use(
      rest.get(
        `${testConfig.mcpEndpoint}/vehicle/:vehicleId/telemetry`,
        (req, res, ctx) => {
          return res(ctx.json(testTelemetryPacket));
        }
      )
    );

    // Wait for next polling cycle (which should attempt reconnection)
    await new Promise((resolve) =>
      setTimeout(resolve, testConfig.pollInterval * 2 + 100)
    );

    // Verify reconnection occurred
    expect(reconnectedSpy).toHaveBeenCalled();
    expect(telemetryService.getState()).toBe("connected");
  });

  /**
   * Test: Force telemetry update
   */
  it("should force a telemetry update when requested", async () => {
    // Start the service
    await telemetryService.start();

    // Force an update
    const result = await telemetryService.forceUpdate();

    // Verify the update was successful
    expect(result).toEqual(
      expect.objectContaining({
        vehicleId: testConfig.vehicleId,
        position: expect.objectContaining({
          lat: expect.any(Number),
          lng: expect.any(Number),
        }),
      })
    );
  });

  /**
   * Test: Watchdog detects data interruptions
   */
  it("should trigger watchdog timeout when no data is received", async () => {
    // Setup a spy for the watchdog timeout event
    const watchdogSpy = vi.fn();
    telemetryService.on("watchdogTimeout", watchdogSpy);

    // Start the service
    await telemetryService.start();

    // Simulate good initial data
    await telemetryService.forceUpdate();

    // Override the handler to stop responding
    server.use(
      rest.get(
        `${testConfig.mcpEndpoint}/vehicle/:vehicleId/telemetry`,
        (req, res) => {
          // Don't respond, let it timeout
          return;
        }
      )
    );

    // Wait for watchdog timeout
    await new Promise((resolve) =>
      setTimeout(resolve, testConfig.watchdogTimeout + 100)
    );

    // Verify watchdog event was triggered
    expect(watchdogSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        vehicleId: testConfig.vehicleId,
      })
    );

    // Verify warning was logged
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Watchdog timeout"),
      })
    );
  });

  /**
   * Test: Stop method cleans up resources
   */
  it("should stop and clean up resources", async () => {
    // Start the service
    await telemetryService.start();

    // Verify service is started
    expect(telemetryService.getState()).toBe("connected");

    // Stop the service
    await telemetryService.stop();

    // Verify service is stopped
    expect(telemetryService.getState()).toBe("disconnected");

    // Verify logger was called
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Vehicle telemetry service stopped successfully",
      })
    );
  });

  /**
   * Test: Telemetry buffer handling
   */
  it("should buffer telemetry when buffer size is not exceeded", async () => {
    // Start the service
    await telemetryService.start();

    // Generate multiple telemetry packets
    const packets = [];
    for (let i = 0; i < 5; i++) {
      packets.push({
        ...testTelemetryPacket,
        timestamp: Date.now() + i * 1000,
        position: {
          ...testTelemetryPacket.position,
          lat: testTelemetryPacket.position.lat + i * 0.01,
        },
      });
    }

    // Override handler to return each packet in sequence
    let packetIndex = 0;
    server.use(
      rest.get(
        `${testConfig.mcpEndpoint}/vehicle/:vehicleId/telemetry`,
        (req, res, ctx) => {
          const packet = packets[packetIndex % packets.length];
          packetIndex++;
          return res(ctx.json(packet));
        }
      )
    );

    // Poll several times
    for (let i = 0; i < 5; i++) {
      await telemetryService.forceUpdate();
    }

    // Verify latest telemetry matches the last packet
    const latestTelemetry = telemetryService.getLatestTelemetry();
    expect(latestTelemetry.position.lat).toBeCloseTo(
      testTelemetryPacket.position.lat + 0.04,
      2
    );
  });

  /**
   * Test: Edge endpoint failure handling
   */
  it("should gracefully handle edge endpoint failures", async () => {
    // Setup edge endpoint to fail
    server.use(
      rest.post(`${testConfig.edgeEndpoint}/telemetry`, (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    // Start the service
    await telemetryService.start();

    // Force an update (which will try to report to the edge)
    const result = await telemetryService.forceUpdate();

    // Should still succeed even though edge reporting failed
    expect(result).toEqual(
      expect.objectContaining({
        vehicleId: testConfig.vehicleId,
      })
    );

    // Verify error was logged
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Failed to report telemetry to Edge"),
      })
    );
  });
});
