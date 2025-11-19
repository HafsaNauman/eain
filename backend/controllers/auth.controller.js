import bcrypt from 'bcryptjs';
import { User, UserVerification, sequelize } from '../models/index.js';
import { generateOTP, isOTPExpired } from '../utils/generateOtp.js';
import { successResponse, errorResponse } from '../utils/responseBuilder.js';
import { generateAccessToken, generateRefreshToken } from '../services/token.service.js';

/**
 * STEP 1: Send OTP to phone number
 * POST /api/auth/send-otp
 * Body: { phone_number }
 */
export const sendOTP = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { phone_number } = req.body;
    
    if (!phone_number) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Phone number is required');
    }
    
    // Check if phone number already registered
    const existingUser = await User.findOne({ where: { phone_number } });
    if (existingUser) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Phone number already registered');
    }
    
    // Generate OTP
    const { code, expiresAt } = generateOTP();
    
    // Save OTP to UserVerification table
    await UserVerification.create({
      phone_number,
      verification_code: code,
      expires_at: expiresAt,
      verification_status: 'pending'
    }, { transaction });
    
    await transaction.commit();
    
    // Print OTP to console
    console.log(`🎯 OTP Code for ${phone_number}: ${code}`);
    
    return successResponse(
      res,
      200,
      'OTP sent successfully (check console for now)',
      { phone_number }
    );
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Send OTP Error:', error);
    return errorResponse(res, 500, 'Failed to send OTP', error.message);
  }
};

/**
 * STEP 2: Verify OTP
 * POST /api/auth/verify-otp
 * Body: { phone_number, otp_code }
 */
export const verifyOTP = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { phone_number, otp_code } = req.body;
    
    if (!phone_number || !otp_code) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Phone number and OTP code are required');
    }
    
    // Find verification record
    const verification = await UserVerification.findOne({
      where: {
        phone_number,
        verification_code: otp_code,
        verification_status: 'pending'
      },
      order: [['created_at', 'DESC']],
      transaction
    });
    
    if (!verification) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Invalid OTP code');
    }
    
    // Check if OTP expired
    if (isOTPExpired(verification.expires_at)) {
      await transaction.rollback();
      return errorResponse(res, 400, 'OTP has expired');
    }
    
    // Mark as verified
    verification.verification_status = 'verified';
    await verification.save({ transaction });
    await transaction.commit();
    
    return successResponse(
      res,
      200,
      'Phone number verified successfully',
      { phone_number, verified: true }
    );
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Verify OTP Error:', error);
    return errorResponse(res, 500, 'Failed to verify OTP', error.message);
  }
};

/**
 * STEP 3: Complete Signup
 * POST /api/auth/signup
 */
export const signup = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      full_name,
      phone_number,
      email,
      password,
      gender,
      preferred_language,
      literacy_level
    } = req.body;
    
    // Validate required fields
    if (!full_name || !phone_number || !password) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Full name, phone number, and password are required');
    }
    
    // Check if phone verified
    const verification = await UserVerification.findOne({
      where: {
        phone_number,
        verification_status: 'verified'
      },
      order: [['created_at', 'DESC']],
      transaction
    });
    
    if (!verification) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Phone number not verified');
    }
    
    // Check if user exists
    const existingUser = await User.findOne({
      where: { phone_number },
      transaction
    });
    
    if (existingUser) {
      await transaction.rollback();
      return errorResponse(res, 400, 'User already exists');
    }
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = await User.create({
      full_name,
      phone_number,
      email: email || null,
      password_hash,
      gender: gender || null,
      preferred_language: preferred_language || 'en',
      literacy_level: literacy_level || 'medium',
      role: 'user',
      is_verified: true
    }, { transaction });
    
    await transaction.commit();
    
    // Generate tokens
    const accessToken = generateAccessToken({
      user_id: newUser.user_id,
      phone_number: newUser.phone_number,
      role: newUser.role
    });
    
    const refreshToken = generateRefreshToken({
      user_id: newUser.user_id
    });
    
    return successResponse(
      res,
      201,
      'User registered successfully',
      {
        user: {
          user_id: newUser.user_id,
          full_name: newUser.full_name,
          phone_number: newUser.phone_number,
          email: newUser.email,
          role: newUser.role
        },
        accessToken,
        refreshToken
      }
    );
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Signup Error:', error);
    return errorResponse(res, 500, 'Failed to register user', error.message);
  }
};

/**
 * Login
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { phone_number, password } = req.body;
    
    if (!phone_number || !password) {
      return errorResponse(res, 400, 'Phone number and password are required');
    }
    
    // Find user
    const user = await User.findOne({ where: { phone_number } });
    
    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return errorResponse(res, 401, 'Invalid credentials');
    }
    
    // Generate tokens
    const accessToken = generateAccessToken({
      user_id: user.user_id,
      phone_number: user.phone_number,
      role: user.role
    });
    
    const refreshToken = generateRefreshToken({
      user_id: user.user_id
    });
    
    return successResponse(
      res,
      200,
      'Login successful',
      {
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          phone_number: user.phone_number,
          email: user.email,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    );
    
  } catch (error) {
    console.error('❌ Login Error:', error);
    return errorResponse(res, 500, 'Failed to login', error.message);
  }
};
