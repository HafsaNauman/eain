// middlewares/featureFlag.js
import { FEATURES } from '../config/features.js';
import { errorResponse } from '../utils/responseBuilder.js';

/**
 * Middleware factory — wraps a route with a feature flag check.
 * Usage: router.get('/route', requireFeature('SERVICE_PROVIDER'), handler)
 */
export const requireFeature = (featureName) => (req, res, next) => {
  if (!FEATURES[featureName]) {
    return errorResponse(res, 404, 'This feature is not available yet');
  }
  next();
};
