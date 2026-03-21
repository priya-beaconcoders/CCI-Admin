/**
 * Simple in-memory caching utility with TTL and in-flight request deduplication.
 */

const cache = {};
const pendingRequests = {};
const DEFAULT_TTL = 2 * 60 * 1000; // 2 minutes

/**
 * Get data from cache if available and not expired.
 */
export const getCache = (key) => {
  const item = cache[key];
  if (!item) return null;

  if (Date.now() > item.expiry) {
    console.log(`[CACHE EXPIRED] ${key}`);
    delete cache[key];
    return null;
  }

  console.log(`[CACHE HIT] ${key}`);
  return item.data;
};

/**
 * Store data in cache with a TTL.
 */
export const setCache = (key, data, ttl = DEFAULT_TTL) => {
  console.log(`[CACHE SET] ${key}`);
  cache[key] = {
    data,
    expiry: Date.now() + ttl,
  };
};

/**
 * Clear cache keys starting with a given prefix.
 */
export const clearCache = (prefix) => {
  console.log(`[CACHE CLEAR] Prefix: ${prefix}`);
  Object.keys(cache).forEach((key) => {
    if (key.startsWith(prefix)) {
      delete cache[key];
    }
  });
};

/**
 * Get a pending request promise if it exists.
 */
export const getPendingRequest = (key) => {
  if (pendingRequests[key]) {
    console.log(`[PENDING REQUEST HIT] ${key}`);
    return pendingRequests[key];
  }
  return null;
};

/**
 * Store a pending request promise and ensure it's cleared after completion.
 */
export const setPendingRequest = (key, promise) => {
  pendingRequests[key] = promise;

  // Ensure cleanup regardless of outcome
  promise
    .then(() => {
      delete pendingRequests[key];
    })
    .catch(() => {
      delete pendingRequests[key];
    });
};
