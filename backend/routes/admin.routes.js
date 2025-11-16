import express from 'express';
import { verifyJWT, isAdmin } from '../middlewares/authJwt.js';
import { successResponse, errorResponse } from '../utils/responseBuilder.js';
import { User } from '../models/index.js';

const router = express.Router();

/**
 * Admin routes - require JWT token + admin role
 */

// Get all users (admin only)
router.get('/users', [verifyJWT, isAdmin], async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] }
    });

    return successResponse(res, 200, 'Users retrieved successfully', { users });
  } catch (error) {
    return errorResponse(res, 500, 'Error retrieving users', error.message);
  }
});

// Delete user (admin only)
router.delete('/users/:userId', [verifyJWT, isAdmin], async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    await user.destroy();

    return successResponse(res, 200, 'User deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Error deleting user', error.message);
  }
});

export default router;
