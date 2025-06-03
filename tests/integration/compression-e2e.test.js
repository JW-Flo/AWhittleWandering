const { COMPRESSION_TIERS, encodeTelemetry, decodeTelemetry } = require('../../edge-worker/src/telemetryCompression');
const fs = require('fs').promises;
const path = require('path');

describe('Geospatial Telemetry Compression E2E Tests', () => {
  // Real-world test data from actual Tesla route
  const sampleRoute = [
    // San Francisco to Los Angeles route points
    { timestamp: 1625097600000, latitude: 37.7749, longitude: -122.4194, speed: 65, battery: 90 }, // SF
    { timestamp: 1625097900000, latitude: 37.4485, longitude: -122.1585, speed: 70, battery: 87 }, // Palo Alto
    { timestamp: 1625098200000, latitude: 37.3387, longitude: -121.8853, speed: 72, battery: 84 }, // San Jose
    { timestamp: 1625098500000, latitude: 36.9741, longitude: -121.5731, speed: 68, battery: 80 }, // Watsonville
    { timestamp: 1625098800000, latitude: 36.2168, longitude: -120.8522, speed: 75, battery: 75 }, // Coalinga
    { timestamp: 1625099100000, latitude: 35.3733, longitude: -119.0187, speed: 73, battery: 65 }, // Bakersfield
    { timestamp: 1625099400000, latitude: 34.0522, longitude: -118.2437, speed: 60, battery: 55 }  // LA
  ];

  // Test data with various edge cases
  const edgeCaseRoutes = {
    stateTransition: [
      { timestamp: 1625097600000, latitude: 42.0046, longitude: -117.0219, speed: 70, battery: 85 }, // OR
      { timestamp: 1625097660000, latitude: 41.9882, longitude: -117.0271, speed: 65, battery: 84 }, // OR/NV border
      { timestamp: 1625097720000, latitude: 41.9665, longitude: -117.0323, speed: 68, battery: 83 }  // NV
    ],
    chargingStop: [
      { timestamp: 1625097600000, latitude: 39.5267, longitude: -119.8126, speed: 0, battery: 15 },  // Approaching
      { timestamp: 1625097900000, latitude: 39.5267, longitude: -119.8126, speed: 0, battery: 20 },  // Charging
      { timestamp: 1625098200000, latitude: 39.5267, longitude: -119.8126, speed: 0, battery: 80 },  // Charged
      { timestamp: 1625098500000, latitude: 39.5270, longitude: -119.8130, speed: 35, battery: 79 }  // Departing
    ],
    highwayInterchange: [
      { timestamp: 1625097600000, latitude: 39.1911, longitude: -121.0715, speed: 65, battery: 70 },
      { timestamp: 1625097660000, latitude: 39.1923, longitude: -121.0684, speed: 45, battery: 69 },
      { timestamp: 1625097720000, latitude: 39.1932, longitude: -121.0665, speed: 35, battery: 69 },
      { timestamp: 1625097780000, latitude: 39.1944, longitude: -121.0649, speed: 55, battery: 68 }
    ]
  };

  describe('Real-world Route Testing', () => {
    it('should maintain route integrity for long-distance travel', async () => {
      // Test compression of full SF to LA route
      const compressed = encodeTelemetry(sampleRoute, COMPRESSION_TIERS.NEAR_LOSSLESS);
      const decompressed = decodeTelemetry(compressed);

      // Verify compression ratio
      const compressionRatio = 1 - (compressed.metadata.compressedSize / compressed.metadata.originalSize);
      expect(compressionRatio).toBeGreaterThanOrEqual(0.95);

      // Verify route accuracy
      decompressed.forEach((point, index) => {
        const original = sampleRoute[index];
        const distance = calculateDistance(
          point.latitude, point.longitude,
          original.latitude, original.longitude
        );
        expect(distance).toBeLessThan(5); // Within 5 meters
      });

      // Verify critical data preservation
      expect(decompressed[0].battery).toBe(sampleRoute[0].battery); // Starting battery
      expect(decompressed[decompressed.length - 1].battery).toBe(sampleRoute[sampleRoute.length - 1].battery); // Ending battery
    });

    it('should preserve state boundary crossings', () => {
      const compressed = encodeTelemetry(edgeCaseRoutes.stateTransition, COMPRESSION_TIERS.LOSSLESS);
      const decompressed = decodeTelemetry(compressed);

      // State boundary point should be preserved exactly
      const boundaryPoint = decompressed[1];
      const originalBoundary = edgeCaseRoutes.stateTransition[1];
      
      expect(boundaryPoint.latitude).toBe(originalBoundary.latitude);
      expect(boundaryPoint.longitude).toBe(originalBoundary.longitude);
    });

    it('should maintain charging stop details', () => {
      const compressed = encodeTelemetry(edgeCaseRoutes.chargingStop, COMPRESSION_TIERS.LOSSLESS);
      const decompressed = decodeTelemetry(compressed);

      // Verify charging session details are preserved
      decompressed.forEach((point, index) => {
        const original = edgeCaseRoutes.chargingStop[index];
        expect(point.battery).toBe(original.battery);
        expect(point.speed).toBe(original.speed);
      });
    });

    it('should handle complex road features', () => {
      const compressed = encodeTelemetry(edgeCaseRoutes.highwayInterchange, COMPRESSION_TIERS.NEAR_LOSSLESS);
      const decompressed = decodeTelemetry(compressed);

      // Verify speed changes are captured
      decompressed.forEach((point, index) => {
        const original = edgeCaseRoutes.highwayInterchange[index];
        expect(Math.abs(point.speed - original.speed)).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('Performance Under Load', () => {
    it('should handle large datasets efficiently', () => {
      // Generate large dataset (1000 points)
      const largeRoute = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: 1625097600000 + (i * 60000),
        latitude: 37.7749 + (i * 0.0001),
        longitude: -122.4194 + (i * 0.0001),
        speed: 65 + (Math.random() * 10),
        battery: 90 - (i * 0.05)
      }));

      const start = process.hrtime();
      
      // Test encoding
      const compressed = encodeTelemetry(largeRoute, COMPRESSION_TIERS.NEAR_LOSSLESS);
      const encodeTime = process.hrtime(start)[1] / 1e6; // Convert to milliseconds
      expect(encodeTime).toBeLessThan(10 * largeRoute.length); // Should still be under 10ms per point

      // Test decoding
      const decodeStart = process.hrtime();
      const decompressed = decodeTelemetry(compressed);
      const decodeTime = process.hrtime(decodeStart)[1] / 1e6;
      expect(decodeTime).toBeLessThan(50); // Under 50ms total
    });

    it('should maintain compression targets under various conditions', () => {
      const conditions = [
        { name: 'Highway', points: sampleRoute },
        { name: 'Urban', points: edgeCaseRoutes.highwayInterchange },
        { name: 'Charging', points: edgeCaseRoutes.chargingStop }
      ];

      conditions.forEach(({ name, points }) => {
        const compressed = encodeTelemetry(points, COMPRESSION_TIERS.NEAR_LOSSLESS);
        const ratio = 1 - (compressed.metadata.compressedSize / compressed.metadata.originalSize);
        expect(ratio).toBeGreaterThanOrEqual(0.95);
      });
    });
  });

  // Helper function to calculate distance between coordinates in meters
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
});
