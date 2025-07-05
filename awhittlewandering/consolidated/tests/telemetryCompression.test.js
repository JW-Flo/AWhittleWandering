const { expect } = require('chai');
const {
  COMPRESSION_TIERS,
  encodeTelemetry,
  decodeTelemetry
} = require('../edge-worker/src/telemetryCompression');

describe('Telemetry Compression', () => {
  // Sample telemetry data for testing
  const sampleData = [
    { timestamp: 1625097600000, latitude: 37.7749, longitude: -122.4194 }, // San Francisco
    { timestamp: 1625097660000, latitude: 37.7746, longitude: -122.4189 },
    { timestamp: 1625097720000, latitude: 37.7742, longitude: -122.4184 },
    { timestamp: 1625097780000, latitude: 37.7737, longitude: -122.4179 },
    { timestamp: 1625097840000, latitude: 37.7733, longitude: -122.4174 }
  ];

  describe('Input Validation', () => {
    it('should throw error for invalid input', () => {
      expect(() => encodeTelemetry(null, COMPRESSION_TIERS.LOSSLESS))
        .to.throw('Compression failed');
      
      expect(() => encodeTelemetry([{ invalid: 'data' }], COMPRESSION_TIERS.LOSSLESS))
        .to.throw('Invalid telemetry point');
    });

    it('should accept valid telemetry data', () => {
      expect(() => encodeTelemetry(sampleData, COMPRESSION_TIERS.LOSSLESS))
        .to.not.throw();
    });
  });

  describe('Compression Performance', () => {
    it('should achieve target compression ratio for each tier', () => {
      // Test Tier 1 (Lossless)
      const losslessResult = encodeTelemetry(sampleData, COMPRESSION_TIERS.LOSSLESS);
      const losslessRatio = 1 - (losslessResult.metadata.compressedSize / losslessResult.metadata.originalSize);
      expect(losslessRatio).to.be.at.least(0.15); // At least 15% compression

      // Test Tier 2 (Near-lossless)
      const nearLosslessResult = encodeTelemetry(sampleData, COMPRESSION_TIERS.NEAR_LOSSLESS);
      const nearLosslessRatio = 1 - (nearLosslessResult.metadata.compressedSize / nearLosslessResult.metadata.originalSize);
      expect(nearLosslessRatio).to.be.at.least(0.35); // At least 35% compression

      // Test Tier 3 (Lossy)
      const lossyResult = encodeTelemetry(sampleData, COMPRESSION_TIERS.LOSSY);
      const lossyRatio = 1 - (lossyResult.metadata.compressedSize / lossyResult.metadata.originalSize);
      expect(lossyRatio).to.be.at.least(0.50); // At least 50% compression
    });

    it('should meet performance targets', () => {
      const start = process.hrtime();
      
      // Test encoding time (should be < 10ms)
      const encoded = encodeTelemetry(sampleData, COMPRESSION_TIERS.NEAR_LOSSLESS);
      const encodeTime = process.hrtime(start)[1] / 1000000; // Convert to milliseconds
      expect(encodeTime).to.be.below(10);

      // Test decoding time (should be < 50ms)
      const decodeStart = process.hrtime();
      decodeTelemetry(encoded);
      const decodeTime = process.hrtime(decodeStart)[1] / 1000000;
      expect(decodeTime).to.be.below(50);
    });
  });

  describe('Accuracy & Data Preservation', () => {
    it('should preserve critical points in lossless mode', () => {
      const encoded = encodeTelemetry(sampleData, COMPRESSION_TIERS.LOSSLESS);
      const decoded = decodeTelemetry(encoded);

      // In lossless mode, all points should be preserved exactly
      expect(decoded.length).to.equal(sampleData.length);
      decoded.forEach((point, i) => {
        expect(point.latitude).to.equal(sampleData[i].latitude);
        expect(point.longitude).to.equal(sampleData[i].longitude);
        expect(point.timestamp).to.equal(sampleData[i].timestamp);
      });
    });

    it('should maintain route accuracy within 5 meters for all tiers', () => {
      const tiers = [
        COMPRESSION_TIERS.LOSSLESS,
        COMPRESSION_TIERS.NEAR_LOSSLESS,
        COMPRESSION_TIERS.LOSSY
      ];

      tiers.forEach(tier => {
        const encoded = encodeTelemetry(sampleData, tier);
        const decoded = decodeTelemetry(encoded);

        // Check each decoded point is within 5 meters of original
        decoded.forEach(decodedPoint => {
          const nearestOriginal = sampleData.reduce((nearest, original) => {
            const R = 6371000; // Earth's radius in meters
            const φ1 = decodedPoint.latitude * Math.PI / 180;
            const φ2 = original.latitude * Math.PI / 180;
            const Δφ = (original.latitude - decodedPoint.latitude) * Math.PI / 180;
            const Δλ = (original.longitude - decodedPoint.longitude) * Math.PI / 180;

            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2);
            
            const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            
            return distance < nearest.distance ? { point: original, distance } : nearest;
          }, { point: null, distance: Infinity });

          expect(nearestOriginal.distance).to.be.below(5); // Within 5 meters
        });
      });
    });
  });
});
