import express from 'express';
import { verifyJWT } from '../middlewares/authJwt.js';
import { successResponse } from '../utils/responseBuilder.js';
import { User } from '../models/index.js';

const router = express.Router();


// Protected user routes - require JWT token


// Get current user profile
router.get('/profile', verifyJWT, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'User profile retrieved', { user });
  } catch (error) {
    return errorResponse(res, 500, 'Error retrieving profile', error.message);
  }
});

// Update user profile
router.put('/profile', verifyJWT, async (req, res) => {
  try {
    const { full_name, email, gender, preferred_language } = req.body;

    const user = await User.findByPk(req.userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Update fields
    if (full_name) user.full_name = full_name;
    if (email) user.email = email;
    if (gender) user.gender = gender;
    if (preferred_language) user.preferred_language = preferred_language;

    await user.save();

    const userResponse = {
      user_id: user.user_id,
      full_name: user.full_name,
      phone_number: user.phone_number,
      email: user.email,
      gender: user.gender,
      preferred_language: user.preferred_language
    };

    return successResponse(res, 200, 'Profile updated successfully', { user: userResponse });
  } catch (error) {
    return errorResponse(res, 500, 'Error updating profile', error.message);
  }
});

export default router;
