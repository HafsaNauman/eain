// api/visualSearchService.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const API_BASE_URL = 'https://mightiest-unextolled-valeri.ngrok-free.dev' ;

export const performVisualSearch = async (imageUri) => {
  try {
    const token = await SecureStore.getItemAsync('userToken');

    // Build multipart form
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'visual_search.jpg',
    });

    const response = await axios.post(
      `${API_BASE_URL}/api/catalog/visual-search`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 25000,
      }
    );

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    }
    return { success: false, error: response.data.message || 'Search failed' };

  } catch (error) {
    console.error('❌ Visual Search API Error:', error.message);
    if (error.code === 'ECONNABORTED') {
      return { success: false, error: 'Request timed out. ML service may be slow.' };
    }
    return {
      success: false,
      error: error.response?.data?.message || 'Visual search failed',
    };
  }
};
