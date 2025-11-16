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
