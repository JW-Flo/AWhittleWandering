import { vi } from "vitest";

// Real data test configuration
export const setupRealDataTest = () => {
  // Clear all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Restore all mocks after each test
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Set up environment variables
  process.env.VITE_MAPBOX_TOKEN =
    process.env.VITE_MAPBOX_TOKEN || "pk.test-token";
  process.env.USE_REAL_DATA = "true";

  // Helper to wait for data loading
  const waitForData = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return {
    waitForData,
  };
};

// Real data test utilities
export const realDataTestUtils = {
  // Capture test failures for analysis
  captureFailure: (testName, error) => {
    const failureData = {
      testName,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
      },
    };

    // In a real implementation, this could:
    // 1. Send to an error tracking service
    // 2. Write to a local file
    // 3. Push to a central logging system
    console.error("Test Failure:", failureData);
    return failureData;
  },

  // Verify real data shape
  verifyDataShape: (data, expectedShape) => {
    const missingFields = [];
    for (const [key, type] of Object.entries(expectedShape)) {
      if (!(key in data)) {
        missingFields.push(key);
      } else if (typeof data[key] !== type) {
        missingFields.push(
          `${key} (expected ${type}, got ${typeof data[key]})`
        );
      }
    }
    return missingFields;
  },
};

// Expected data shapes for verification
export const expectedDataShapes = {
  vehicleData: {
    latitude: "number",
    longitude: "number",
    speed: "number",
    batteryLevel: "number",
  },
  weatherData: {
    temp: "number",
    description: "string",
  },
  tripData: {
    currentStop: "string",
    visitedStates: "object", // Array
  },
};
