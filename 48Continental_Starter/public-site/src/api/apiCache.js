/**
 * Lightweight API Caching Module
 * Implements in-flight request deduplication and TTL-based caching.
 */

const cache = {};
const pending = {};

/**
 * Retrieves cached data for the given key if it exists and is fresh.
 * @param {string} key - Cache key.
 * @param {number} ttl - Time-to-live in milliseconds.
 * @returns {any|null} Cached data or null if expired.
 */
function get(key, ttl = 60000) {
  const entry = cache[key];
  if (entry && (Date.now() - entry.timestamp < ttl)) {
    return entry.data;
  }
  return null;
}

/**
 * Stores data in the cache with the current timestamp.
 * @param {string} key - Cache key.
 * @param {any} data - Data to cache.
 */
function set(key, data) {
  cache[key] = { data, timestamp: Date.now() };
}

/**
 * Executes an API request with deduplication and caching.
 * If a request for the same key is in-flight, it returns the pending promise.
 * Otherwise, it invokes the requestFunction and caches its result.
 * @param {string} key - Unique key for the request.
 * @param {Function} requestFunction - Async function that performs the API request.
 * @param {number} ttl - Cache TTL in milliseconds.
 * @returns {Promise<any>} The fetched data.
 */
async function cachedRequest(key, requestFunction, ttl = 60000) {
  const cachedData = get(key, ttl);
  if (cachedData !== null) {
    return cachedData;
  }
  if (pending[key]) {
    return pending[key];
  }
  pending[key] = (async () => {
    try {
      const data = await requestFunction();
      set(key, data);
      return data;
    } finally {
      delete pending[key];
    }
  })();
  return pending[key];
}

export { cachedRequest, get, set };
