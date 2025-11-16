import jwt from 'jsonwebtoken';
import authConfig from '../config/auth.config.js';

/**
 * Generate JWT access token
 * @param {Object} payload - User data to encode
 * @returns {String} JWT token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, authConfig.secret, {
    expiresIn: authConfig.jwtExpiration
  });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - User data to encode
 * @returns {String} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, authConfig.secret, {
    expiresIn: authConfig.jwtRefreshExpiration
  });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, authConfig.secret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};
