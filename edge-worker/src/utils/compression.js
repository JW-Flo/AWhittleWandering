/**
 * Compression utilities for the 48 Continental USA project
 * Handles compression and decompression of data for efficient transmission
 * 
 * @typedef {Object} CompressionResult
 * @property {Uint8Array|string|object} data - The compressed or original data
 * @property {boolean} compressed - Whether the data is compressed
 * @property {number} originalSize - Size of the original data in bytes
 * @property {number} [compressedSize] - Size of the compressed data in bytes
 * @property {string} [error] - Error message if compression failed
 */

/* global TextEncoder, TextDecoder, CompressionStream, DecompressionStream, console */

/**
 * Compresses data using CompressionStream API with gzip encoding
 * @param {object|string} data - Data to compress
 * @returns {Promise<Uint8Array>} Compressed data as Uint8Array
 * @throws {Error} If compression fails
 */
export async function compressData(data) {
  try {
    // Convert data to string if it's an object
    const inputData = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Convert string to Uint8Array
    const encoder = new TextEncoder();
    const inputBytes = encoder.encode(inputData);
    
    // Create a compression stream
    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    const reader = cs.readable.getReader();
    
    // Write data to the compression stream
    writer.write(inputBytes);
    writer.close();
    
    // Read compressed data
    const chunks = [];
    let totalLength = 0;
    
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      totalLength += value.length;
    }
    
    // Concatenate chunks into a single Uint8Array
    const compressedData = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      compressedData.set(chunk, offset);
      offset += chunk.length;
    }
    
    return compressedData;
  } catch (error) {
    console.error('Compression failed:', error);
    throw new Error(`Compression failed: ${error.message}`);
  }
}

/**
 * Decompresses data using DecompressionStream API with gzip encoding
 * @param {Uint8Array} compressedData - Compressed data as Uint8Array
 * @returns {Promise<object|string>} Decompressed data
 * @throws {Error} If decompression fails
 */
export async function decompressData(compressedData) {
  try {
    // Create a decompression stream
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();
    
    // Write compressed data to the decompression stream
    writer.write(compressedData);
    writer.close();
    
    // Read decompressed data
    const chunks = [];
    let totalLength = 0;
    
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      totalLength += value.length;
    }
    
    // Concatenate chunks into a single Uint8Array
    const decompressedBytes = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      decompressedBytes.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Convert Uint8Array to string
    const decoder = new TextDecoder();
    const decompressedString = decoder.decode(decompressedBytes);
    
    // Try to parse as JSON, return as string if not valid JSON
    try {
      return JSON.parse(decompressedString);
    } catch {
      return decompressedString;
    }
  } catch (error) {
    console.error('Decompression failed:', error);
    throw new Error(`Decompression failed: ${error.message}`);
  }
}

/**
 * Safely compresses data with fallback to original data if compression fails
 * @param {object|string} data - Data to compress
 * @param {object} options - Options for compression
 * @param {boolean} options.forceCompress - If true, throws error on compression failure instead of using fallback
 * @returns {Promise<{data: Uint8Array|string|object, compressed: boolean, originalSize: number, compressedSize?: number}>}
 */
export async function safeCompress(data, options = {}) {
  const { forceCompress = false } = options;
  const originalSize = typeof data === 'string' ? data.length : JSON.stringify(data).length;
  
  try {
    const compressedData = await compressData(data);
    const compressedSize = compressedData.length;
    
    // Only use compression if it actually saves space
    if (compressedSize < originalSize) {
      return {
        data: compressedData,
        compressed: true,
        originalSize,
        compressedSize
      };
    } else {
      console.info('Compression ineffective, using original data');
      return {
        data,
        compressed: false,
        originalSize
      };
    }
  } catch (error) {
    console.warn('Compression failed, using fallback:', error);
    
    if (forceCompress) {
      throw error;
    }
    
    return {
      data,
      compressed: false,
      originalSize,
      error: error.message
    };
  }
}

/**
 * Safely decompresses data with fallback handling
 * @param {object} payload - Payload containing data and compression metadata
 * @param {Uint8Array|string|object} payload.data - The data to decompress
 * @param {boolean} payload.compressed - Whether the data is compressed
 * @returns {Promise<object|string>} - Decompressed data
 */
export async function safeDecompress(payload) {
  const { data, compressed } = payload;
  
  if (!compressed) {
    return data;
  }
  
  try {
    return await decompressData(data);
  } catch (error) {
    console.error('Decompression failed, cannot recover data:', error);
    throw new Error(`Decompression failed: ${error.message}`);
  }
}
