/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls:
 * - Send OTP
 * - Verify OTP
 * - Sign Up
 * - Login
 * 
 * Each function returns a standardized response format
 */

import apiClient from './client';
import API_CONFIG from './config';

/**
 * Send OTP to phone number
 * 
 * @param {string} phoneNumber - Phone number with country code (e.g., "+923001234567")
 * @returns {Promise} Response with OTP sent confirmation
 * 
 * Backend endpoint: POST /api/auth/send-otp
 * Body: { phone_number: string }
 */
export const sendOTP = async (phoneNumber) => {
  try {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SEND_OTP, {
      phone_number: phoneNumber,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to send OTP',
    };
  }
};

/**
 * Verify OTP code
 * 
 * @param {string} phoneNumber - Phone number
 * @param {string} otpCode - 6-digit OTP code
 * @returns {Promise} Response with verification status
 * 
 * Backend endpoint: POST /api/auth/verify-otp
 * Body: { phone_number: string, otp_code: string }
 */
export const verifyOTP = async (phoneNumber, otpCode) => {
  try {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_OTP, {
      phone_number: phoneNumber,
      otp_code: otpCode,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Invalid OTP code',
    };
  }
};

/**
 * Sign up new user
 * 
 * @param {Object} userData - User registration data
 * @param {string} userData.firstName - First name
 * @param {string} userData.lastName - Last name
 * @param {string} userData.phoneNumber - Phone number (already verified)
 * @param {string} userData.email - Email (optional)
 * @param {string} userData.password - Password
 * @param {string} userData.gender - "male" or "female"
 * @param {string} userData.role - "customer", "service_provider", or "vendor"
 * @returns {Promise} Response with user data and tokens
 * 
 * Backend endpoint: POST /api/auth/signup
 * Body: { full_name, phone_number, email, password, gender, role }
 */
export const signUp = async (userData) => {
  try {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SIGNUP, {
      full_name: `${userData.firstName} ${userData.lastName}`,
      phone_number: userData.phoneNumber,
      email: userData.email || null,
      password: userData.password,
      gender: userData.gender,
      // Note: Backend expects 'user' role, but frontend allows selection
      // You may need to adjust based on backend schema
      role: userData.role || 'user',
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to sign up',
    };
  }
};

/**
 * Login user
 * 
 * @param {string} phoneNumber - Phone number
 * @param {string} password - Password
 * @returns {Promise} Response with user data and tokens
 * 
 * Backend endpoint: POST /api/auth/login
 * Body: { phone_number: string, password: string }
 */
export const login = async (phoneNumber, password) => {
  try {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      phone_number: phoneNumber,
      password: password,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Invalid credentials',
    };
  }
};
//NEW CODE FOR VENDOR REGISTRATION
export const registerBusiness = async (businessData) => {
  try {
    // Create FormData for file upload
    const formData = new FormData();
    
    formData.append('userId', businessData.userId);
    formData.append('businessName', businessData.businessName);
    formData.append('cnic', businessData.cnic);
    formData.append('businessType', businessData.businessType);
    formData.append('businessEmail', businessData.businessEmail);
    formData.append('businessPhone', businessData.businessPhone);
    formData.append('businessCategory', businessData.businessCategory);
    formData.append('businessDescription', businessData.businessDescription);
    formData.append('officeAddress', businessData.officeAddress);
    
    // Append logo file
    if (businessData.logo) {
      formData.append('logo', {
        uri: businessData.logo.uri,
        type: 'image/jpeg',
        name: 'business-logo.jpg',
      });
    }

    const response = await fetch(`${API_BASE_URL}/business/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const result = await response.json();
    return { success: response.ok, ...result };
  } catch (error) {
    console.error('Business registration error:', error);
    return { success: false, error: 'Network error' };
  }
};