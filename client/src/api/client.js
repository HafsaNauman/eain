/**
 * Axios API Client
 * 
 * Centralized HTTP client with:
 * - Request/response interceptors
 * - Automatic token injection
 * - Error handling
 * - Request/response logging
 */

import axios from 'axios';
import API_CONFIG from './config';
import { getAccessToken } from '../utils/storage';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to all requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error adding auth token:', error);
    }

    // Log request (helpful for debugging)
    console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors
apiClient.interceptors.response.use(
  (response) => {
    // Log response
    console.log(`📥 ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config.url,
      });

      // Handle specific status codes
      if (error.response.status === 401) {
        // Unauthorized - token may be expired. Clear storage.
        console.log('Unauthorized access - token may be expired. Clearing local storage.');
        import('../utils/storage').then(storage => {
          storage.clearAuthData();
        });
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error - No response received:', error.message);
    } else {
      // Error in request setup
      console.error('Request Setup Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;