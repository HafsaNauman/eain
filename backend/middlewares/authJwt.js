import { verifyToken } from '../services/token.service.js';
import { errorResponse } from '../utils/responseBuilder.js';
import { User } from '../models/index.js';


// Verify JWT token from request header
export const verifyJWT = async (req, res, next) => {
  try {
    // // Get token from header
    // const token = req.headers['authorization']?.split(' '); // Bearer TOKEN
    // console.log('🔍 Auth Header:', authHeader); // Debug log

    // if (!token) {
    //   return errorResponse(res, 403, 'No token provided');
    // }

    // // Verify token
    // const decoded = verifyToken(token);
    // req.userId = decoded.user_id;
    // req.userRole = decoded.role;

    // next();

  // } catch (error) {
  //   return errorResponse(res, 401, 'Unauthorized - Invalid token', error.message);
  // }
    // Debug: Check what we receive
    console.log('Full Headers:', req.headers);
    const authHeader = req.headers['authorization'];
    console.log('Authorization Header:', authHeader);
    
    // Get token from header
    const token = authHeader?.split(' ')[1]; // Bearer TOKEN
    console.log('🔍 Extracted Token:', token);

    if (!token) {
      return errorResponse(res, 403, 'No token provided');
    }

    // Verify token
    console.log(' About to verify token...');
    const decoded = verifyToken(token);
    console.log(' Token Decoded Successfully:', decoded);
    
    req.userId = decoded.user_id;
    req.userRole = decoded.role;
    req.userGender = decoded.gender;

    next();
  } catch (error) {
    console.error(' Token Verification Error:', error);
    console.error(' Error Details:', error.message);
    return errorResponse(res, 401, 'Unauthorized - Invalid token', error.message);
  }
};


// Check if user is admin

export const isAdmin = async (req, res, next) => {
  try {
    if (req.userRole === 'admin') {
      next();
    } else {
      return errorResponse(res, 403, 'Require Admin Role');
    }
  } catch (error) {
    return errorResponse(res, 500, 'Error checking admin role', error.message);
  }
};
// Check if user is moderator
export const isModerator = async (req, res, next) => {
  try {
    if (req.userRole === 'moderator' || req.userRole === 'admin') {
      next();
    } else {
      return errorResponse(res, 403, 'Require Moderator Role');
    }
  } catch (error) {
    return errorResponse(res, 500, 'Error checking moderator role', error.message);
  }
};


// Optional JWT verification
// Verifies token if present, but doesn't fail if missing

export const verifyJWTOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      // No token provided - that's okay for public endpoints
      req.userId = null;
      req.userRole = null;
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      req.userId = null;
      req.userRole = null;
      return next();
    }

    // Token provided - try to verify it
    try {
      const decoded = verifyToken(token);
      req.userId = decoded.user_id;
      req.userRole = decoded.role;
      req.userGender = decoded.gender;
      console.log(' Authenticated user:', req.userId);
    } catch (err) {
      // Token invalid - continue anyway for public endpoints
      console.log('Invalid token, continuing as anonymous');
      req.userId = null;
      req.userRole = null;
      req.userGender = null;
    }

    next();
  } catch (error) {
    // Don't fail - just continue without authentication
    req.userId = null;
    req.userRole = null;
    req.userGender = null;
    next();
  }
};
