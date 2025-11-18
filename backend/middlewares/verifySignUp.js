import { User } from '../models/index.js';
import { errorResponse } from '../utils/responseBuilder.js';


// Check if phone number or email already exists

export const checkDuplicatePhoneOrEmail = async (req, res, next) => {
  try {
    const { phone_number, email } = req.body;

    // Check if phone number already exists
    if (phone_number) {
      const phoneExists = await User.findOne({ where: { phone_number } });
      if (phoneExists) {
        return errorResponse(res, 400, 'Phone number is already in use');
      }
    }

    // Check if email already exists
    if (email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return errorResponse(res, 400, 'Email is already in use');
      }
    }

    next();
  } catch (error) {
    return errorResponse(res, 500, 'Error checking duplicates', error.message);
  }
};


// Validate signup fields

export const validateSignupFields = (req, res, next) => {
  const { full_name, phone_number, password } = req.body;

  if (!full_name || full_name.trim() === '') {
    return errorResponse(res, 400, 'Full name is required');
  }

  if (!phone_number || phone_number.trim() === '') {
    return errorResponse(res, 400, 'Phone number is required');
  }

  if (!password || password.length < 6) {
    return errorResponse(res, 400, 'Password must be at least 6 characters long');
  }

  next();
};
