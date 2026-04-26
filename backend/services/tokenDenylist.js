/**
 * tokenDenylist.js
 *
 * In-memory token denylist for logout invalidation.
 * Tokens are stored with their expiry time so the set
 * never grows unboundedly — expired entries are pruned
 * automatically on each add/check.
 *
 * NOTE: This is process-local. If you run multiple
 * backend instances, upgrade to a shared Redis store.
 */

// Map<token, expiresAtMs>
const denylist = new Map();

/**
 * Add a token to the denylist.
 * @param {string} token - Raw JWT string
 * @param {number} expiresAt - Unix timestamp (seconds) from JWT exp claim
 */
export const addToDenylist = (token, expiresAt) => {
  pruneExpired();
  denylist.set(token, expiresAt * 1000); // convert to ms
};

/**
 * Returns true if the token has been revoked.
 * @param {string} token
 */
export const isRevoked = (token) => {
  pruneExpired();
  return denylist.has(token);
};

/** Remove all entries whose expiry has already passed. */
const pruneExpired = () => {
  const now = Date.now();
  for (const [token, expiresAtMs] of denylist.entries()) {
    if (now > expiresAtMs) denylist.delete(token);
  }
};
