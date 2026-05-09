/**
 * Success response wrapper
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Object} data - Response data
 */
export const successResponse = (res, statusCode = 200, message, data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Error response wrapper
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Object} errors - Error details
 */
export const errorResponse = (res, statusCode = 500, message, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

/**
 * Parses a string query param to a boolean.
 * Returns undefined if the value is not present, so it can be safely
 * used in a Sequelize `where` clause without accidentally filtering.
 *
 * @param {String|undefined} val - The raw query string value (e.g. 'true' or 'false')
 * @returns {Boolean|undefined}
 *
 * @example
 * // In a controller:
 * if (parseBoolean(req.query.is_active) !== undefined)
 *   where.is_active = parseBoolean(req.query.is_active);
 */
export const parseBoolean = (val) => {
  if (val === undefined || val === null) return undefined;
  return val === 'true';
};
