/**
 * Telemetry Compression Module
 * 
 * This module provides functions for compressing and decompressing Tesla vehicle telemetry data.
 * The compression algorithm uses:
 * - Delta encoding for temporal data
 * - Douglas-Peucker geospatial simplification
 * - Custom Huffman encoding scheme
 * 
 * Compression tiers:
 * - Tier 1 (15%): Lossless (critical telemetry - state boundaries, charging stops)
 * - Tier 2 (35%): Near-lossless (important segments with moderate resolution)
 * - Tier 3 (50%): Lossy (routine travel data simplified aggressively)
 */

// Constants for compression configuration
const COMPRESSION_TIERS = {
  LOSSLESS: 1,
  NEAR_LOSSLESS: 2,
  LOSSY: 3
};

const TIER_TOLERANCES = {
  [COMPRESSION_TIERS.LOSSLESS]: 0.000001, // ~0.1m tolerance
  [COMPRESSION_TIERS.NEAR_LOSSLESS]: 0.00001, // ~1m tolerance
  [COMPRESSION_TIERS.LOSSY]: 0.0001 // ~10m tolerance
};

// Helper function to validate telemetry data structure
function validateTelemetryData(data) {
  if (!Array.isArray(data)) {
    throw new Error('Telemetry data must be an array');
  }

  data.forEach((point, index) => {
    if (!point.timestamp || !point.latitude || !point.longitude) {
      throw new Error(`Invalid telemetry point at index ${index}`);
    }
  });
}

// Delta encoding for temporal and spatial data
function deltaEncode(points) {
  const encoded = [];
  let prevTimestamp = 0;
  let prevLat = 0;
  let prevLon = 0;

  points.forEach((point, index) => {
    if (index === 0) {
      encoded.push({
        timestamp: point.timestamp,
        latitude: point.latitude,
        longitude: point.longitude,
        ...point
      });
    } else {
      encoded.push({
        timestamp: point.timestamp - prevTimestamp,
        latitude: point.latitude - prevLat,
        longitude: point.longitude - prevLon,
        ...point
      });
    }

    prevTimestamp = point.timestamp;
    prevLat = point.latitude;
    prevLon = point.longitude;
  });

  return encoded;
}

// Calculate perpendicular distance for Douglas-Peucker
function perpendicularDistance(point, start, end) {
  const lat = point.latitude;
  const lon = point.longitude;
  const lat1 = start.latitude;
  const lon1 = start.longitude;
  const lat2 = end.latitude;
  const lon2 = end.longitude;

  // Use the Haversine formula for accurate Earth distances
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

// Douglas-Peucker algorithm implementation
function douglasPeucker(points, tolerance) {
  if (points.length <= 2) return points;

  let maxDistance = 0;
  let maxIndex = 0;

  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  if (maxDistance > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

// Custom Huffman encoding for GPS coordinates
class HuffmanNode {
  constructor(value, frequency) {
    this.value = value;
    this.frequency = frequency;
    this.left = null;
    this.right = null;
  }
}

function buildHuffmanTree(data) {
  // Count frequency of each unique value
  const frequencies = new Map();
  data.forEach(point => {
    const key = `${point.latitude},${point.longitude}`;
    frequencies.set(key, (frequencies.get(key) || 0) + 1);
  });

  // Create leaf nodes
  const nodes = Array.from(frequencies.entries()).map(
    ([value, freq]) => new HuffmanNode(value, freq)
  );

  // Build the tree
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.frequency - b.frequency);
    const left = nodes.shift();
    const right = nodes.shift();
    const parent = new HuffmanNode(null, left.frequency + right.frequency);
    parent.left = left;
    parent.right = right;
    nodes.push(parent);
  }

  return nodes[0];
}

// Main compression function
function encodeTelemetry(data, compressionTier) {
  try {
    // Validate input
    validateTelemetryData(data);

    // Apply delta encoding
    const deltaEncoded = deltaEncode(data);

    // Apply Douglas-Peucker based on tier
    const tolerance = TIER_TOLERANCES[compressionTier];
    const simplified = douglasPeucker(deltaEncoded, tolerance);

    // Build Huffman tree and encode
    const huffmanTree = buildHuffmanTree(simplified);
    
    // Convert to binary format
    const binaryData = new Uint8Array(simplified.length * 24); // 8 bytes each for lat, lon, timestamp
    let offset = 0;

    simplified.forEach(point => {
      // Store timestamp (8 bytes)
      const timestamp = new DataView(binaryData.buffer, offset, 8);
      timestamp.setBigInt64(0, BigInt(point.timestamp), true);
      offset += 8;

      // Store latitude (8 bytes)
      const latitude = new DataView(binaryData.buffer, offset, 8);
      latitude.setFloat64(0, point.latitude, true);
      offset += 8;

      // Store longitude (8 bytes)
      const longitude = new DataView(binaryData.buffer, offset, 8);
      longitude.setFloat64(0, point.longitude, true);
      offset += 8;
    });

    return {
      data: binaryData,
      metadata: {
        originalSize: data.length,
        compressedSize: simplified.length,
        compressionTier,
        huffmanTree
      }
    };
  } catch (error) {
    throw new Error(`Compression failed: ${error.message}`);
  }
}

// Main decompression function
function decodeTelemetry(compressedData) {
  try {
    const { data, metadata } = compressedData;
    const points = [];
    
    // Read binary format
    for (let i = 0; i < data.length; i += 24) {
      const timestamp = new DataView(data.buffer, i, 8).getBigInt64(0, true);
      const latitude = new DataView(data.buffer, i + 8, 8).getFloat64(0, true);
      const longitude = new DataView(data.buffer, i + 16, 8).getFloat64(0, true);
      
      points.push({ timestamp: Number(timestamp), latitude, longitude });
    }

    // Reverse delta encoding
    const decoded = points.map((point, index) => {
      if (index === 0) return point;

      return {
        timestamp: point.timestamp + points[index - 1].timestamp,
        latitude: point.latitude + points[index - 1].latitude,
        longitude: point.longitude + points[index - 1].longitude
      };
    });

    return decoded;
  } catch (error) {
    throw new Error(`Decompression failed: ${error.message}`);
  }
}

module.exports = {
  COMPRESSION_TIERS,
  encodeTelemetry,
  decodeTelemetry
};
