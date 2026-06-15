/**
 * Client-side Rate Limiter
 * Prevents users from spamming actions (e.g. posting, messaging).
 * Uses an in-memory sliding window per action key.
 */

const actionTimestamps = {};

/**
 * Check whether an action is allowed under the rate limit.
 * @param {string} key - Unique identifier for the action (e.g. 'create-post', 'send-message').
 * @param {number} maxCalls - Maximum number of calls allowed within the window.
 * @param {number} windowMs - Time window in milliseconds (default: 60 seconds).
 * @returns {{ allowed: boolean, remainingMs: number }}
 */
export function checkRateLimit(key, maxCalls = 5, windowMs = 60_000) {
  const now = Date.now();
  if (!actionTimestamps[key]) actionTimestamps[key] = [];

  // Evict timestamps outside the window
  actionTimestamps[key] = actionTimestamps[key].filter(t => now - t < windowMs);

  if (actionTimestamps[key].length >= maxCalls) {
    const oldest = actionTimestamps[key][0];
    const remainingMs = windowMs - (now - oldest);
    return { allowed: false, remainingMs };
  }

  actionTimestamps[key].push(now);
  return { allowed: true, remainingMs: 0 };
}

/**
 * Reset rate limit for a specific key (e.g. after logout).
 * @param {string} key
 */
export function resetRateLimit(key) {
  delete actionTimestamps[key];
}

/**
 * Clear all rate limit records (e.g. on logout).
 */
export function clearAllRateLimits() {
  Object.keys(actionTimestamps).forEach(k => delete actionTimestamps[k]);
}