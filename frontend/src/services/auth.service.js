import apiClient from './api.service.js';
import { API_ENDPOINTS } from '../config/api.config.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  // STEP 1: Send OTP
  async sendOTP(phoneNumber) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SEND_OTP, {
        phone_number: phoneNumber,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // STEP 2: Verify OTP
  async verifyOTP(phoneNumber, otpCode) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.VERIFY_OTP, {
        phone_number: phoneNumber,
        otp_code: otpCode,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // STEP 3: Complete Signup
  async signup(userData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SIGNUP, userData);
      
      // Store tokens
      if (response.data?.accessToken) {
        await AsyncStorage.setItem('accessToken', response.data.accessToken);
      }
      if (response.data?.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Login
  async login(phoneNumber, password) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
        phone_number: phoneNumber,
        password: password,
      });
      
      // Store tokens
      if (response.data?.accessToken) {
        await AsyncStorage.setItem('accessToken', response.data.accessToken);
      }
      if (response.data?.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Logout
  async logout() {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
  }

  // Check if user is authenticated
  async isAuthenticated() {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  }
}

export default new AuthService();
