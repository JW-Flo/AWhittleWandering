// Mock for telemetryCompression module in tests

export const COMPRESSION_TIERS = {
  LOSSLESS: 1,
  NEAR_LOSSLESS: 2,
  LOSSY: 3,
};

export const encodeTelemetry = (data, tier) => {
  return {
    data: data.slice(0, Math.floor(data.length * 0.8)), // Simulate compression
    metadata: {
      originalSize: data.length * 100,
      compressedSize: data.length * 80,
      tier,
    },
  };
};

export const decodeTelemetry = (compressed) => {
  return compressed.data;
};
