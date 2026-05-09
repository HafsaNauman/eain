
// import axios from 'axios';
// import API_CONFIG from './config';
// import { getAccessToken } from '../utils/storage';

// // Create axios instance
// const apiClient = axios.create({
//   baseURL: API_CONFIG.BASE_URL,
//   timeout: API_CONFIG.TIMEOUT,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Request interceptor to add auth token
// apiClient.interceptors.request.use(
//   async (config) => {
//     const token = await getAccessToken();
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// /**
//  * Send OTP to phone number
//  */
// export const sendOTP = async (phoneNumber) => {
//   try {
//     const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SEND_OTP, {
//       phone_number: phoneNumber,
//     });
//     return {
//       success: true,
//       data: response.data,
//     };
//   } catch (error) {
//     console.error('Send OTP Error:', error);
//     return {
//       success: false,
//       error: error.response?.data?.message || 'Failed to send OTP',
//     };
//   }
// };

// /**
//  * Verify OTP code
//  */
// export const verifyOTP = async (phoneNumber, otpCode) => {
//   try {
//     const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_OTP, {
//       phone_number: phoneNumber,
//       otp_code: otpCode,
//     });
//     return {
//       success: true,
//       data: response.data,
//     };
//   } catch (error) {
//     console.error('Verify OTP Error:', error);
//     return {
//       success: false,
//       error: error.response?.data?.message || 'Invalid OTP code',
//     };
//   }
// };

// /**
//  * Sign up new user
//  */
// export const signUp = async (userData) => {
//   try {
//     const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SIGNUP, {
//       full_name: `${userData.firstName} ${userData.lastName}`,
//       phone_number: userData.phoneNumber,
//       email: userData.email || null,
//       password: userData.password,
//       gender: userData.gender,
//       role: userData.role, // 'customer' or 'vendor'
//     });
//     return {
//       success: true,
//       data: response.data,
//     };
//   } catch (error) {
//     console.error('Sign Up Error:', error);
//     return {
//       success: false,
//       error: error.response?.data?.message || 'Failed to sign up',
//     };
//   }
// };

// /**
//  * Login user
//  */
// export const login = async (phoneNumber, password) => {
//   try {
//     const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
//       phone_number: phoneNumber,
//       password: password,
//     });
//     return {
//       success: true,
//       data: response.data,
//     };
//   } catch (error) {
//     console.error('Login Error:', error);
//     return {
//       success: false,
//       error: error.response?.data?.message || 'Invalid credentials',
//     };
//   }
// };

// /**
//  * Logout user — tells the backend to revoke the access token,
//  * then clears local storage via AuthContext.logout().
//  * Always resolves (never throws) so the UI can safely clear
//  * local state even if the network call fails.
//  */
// export const logoutApi = async () => {
//   try {
//     await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
//     return { success: true };
//   } catch (error) {
//     // Silently succeed — local tokens will be cleared regardless
//     console.warn('Logout API call failed (token may already be expired):', error.message);
//     return { success: true };
//   }
// };

// export default apiClient;
import API_CONFIG from './config';
import apiClient from './client';

export const sendOTP = async (phoneNumber) => {
  try {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SEND_OTP, {
      phone_number: phoneNumber,
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Send OTP Error:', error);
    return { success: false, error: error.response?.data?.message || 'Failed to send OTP' };
  }
};

export const verifyOTP = async (phoneNumber, otpCode) => {
  try {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_OTP, {
      phone_number: phoneNumber,
      otp_code: otpCode,
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return { success: false, error: error.response?.data?.message || 'Invalid OTP code' };
  }
};

export const signUp = async (userData) => {
  try {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SIGNUP, {
      full_name: `${userData.firstName} ${userData.lastName}`,
      phone_number: userData.phoneNumber,
      email: userData.email || null,
      password: userData.password,
      gender: userData.gender,
      role: userData.role,
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Sign Up Error:', error);
    return { success: false, error: error.response?.data?.message || 'Failed to sign up' };
  }
};

export const login = async (phoneNumber, password) => {
  try {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
      phone_number: phoneNumber,
      password: password,
    });
    console.log('🔍 RAW LOGIN RESPONSE:', JSON.stringify(response.data, null, 2));
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Login Error:', error);
    return { success: false, error: error.response?.data?.message || 'Invalid credentials' };
  }
};

export const logoutApi = async () => {
  try {
    await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {});
    return { success: true };
  } catch (error) {
    console.warn('Logout API call failed:', error.message);
    return { success: true };
  }
};