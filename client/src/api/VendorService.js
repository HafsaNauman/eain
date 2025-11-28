// /**
//  * Vendor Service - Business Registration & Profile Management
//  */

// import apiClient from './authService';
// import { getAccessToken } from '../utils/storage';

// /**
//  * Create or update vendor profile
//  * POST /api/vendor/profile
//  */
// export const createVendorProfile = async (profileData) => {
//   try {
//     const token = await getAccessToken();
    
//     const response = await apiClient.post(
//       '/api/vendor/profile',
//       {
//         vendor_type: profileData.businessType, // 'product' or 'service'
//         business_name_en: profileData.businessName,
//         business_name_ur: profileData.businessNameUrdu || null,
//         description_en: profileData.businessDescription,
//         description_ur: profileData.businessDescriptionUrdu || null,
//         category: profileData.businessCategory,
//         city: profileData.city || null,
//         area: profileData.area || null,
//         location: profileData.location || null,
//         is_female_only: profileData.isFemaleOnly || false,
//         media: profileData.media || null,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     return {
//       success: true,
//       data: response.data,
//     };
//   } catch (error) {
//     console.error('Create Vendor Profile Error:', error);
//     return {
//       success: false,
//       error: error.response?.data?.message || 'Failed to create vendor profile',
//     };
//   }
// };

// /**
//  * Get vendor profile
//  * GET /api/vendor/profile
//  */
// export const getVendorProfile = async () => {
//   try {
//     const token = await getAccessToken();
    
//     const response = await apiClient.get('/api/vendor/profile', {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     return {
//       success: true,
//       data: response.data,
//     };
//   } catch (error) {
//     console.error('Get Vendor Profile Error:', error);
//     return {
//       success: false,
//       error: error.response?.data?.message || 'Failed to get vendor profile',
//     };
//   }
// };

// /**
//  * Update vendor profile
//  * PUT /api/vendor/profile
//  */
// export const updateVendorProfile = async (updates) => {
//   try {
//     const token = await getAccessToken();
    
//     const response = await apiClient.put('/api/vendor/profile', updates, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     return {
//       success: true,
//       data: response.data,
//     };
//   } catch (error) {
//     console.error('Update Vendor Profile Error:', error);
//     return {
//       success: false,
//       error: error.response?.data?.message || 'Failed to update vendor profile',
//     };
//   }
// };

// /**
//  * Create listing
//  * POST /api/vendor/listings
//  */
// export const createListing = async (listingData) => {
//   try {
//     const token = await getAccessToken();
    
//     const response = await apiClient.post('/api/vendor/listings', listingData, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     return {
//       success: true,
//       data: response.data,
//     };
//   } catch (error) {
//     console.error('Create Listing Error:', error);
//     return {
//       success: false,
//       error: error.response?.data?.message || 'Failed to create listing',
//     };
//   }
// };

// /**
//  * Get vendor listings
//  * GET /api/vendor/listings
//  */
// export const getVendorListings = async () => {
//   try {
//     const token = await getAccessToken();
    
//     const response = await apiClient.get('/api/vendor/listings', {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });

//     return {
//       success: true,
//       data: response.data,
//     };
//   } catch (error) {
//     console.error('Get Vendor Listings Error:', error);
//     return {
//       success: false,
//       error: error.response?.data?.message || 'Failed to get listings',
//     };
//   }
// };


/**
 * Vendor Service - Business Registration & Profile Management
 */

import axios from 'axios';
import API_CONFIG from './config';
import { getAccessToken } from '../utils/storage';

/**
 * Create or update vendor profile
 * POST /api/vendor/profile
 */
export const createVendorProfile = async (profileData) => {
  try {
    const token = await getAccessToken();
    
    console.log('🔑 Access Token:', token);
    
    if (!token) {
      return {
        success: false,
        error: 'No access token found. Please login again.',
      };
    }

    const response = await axios.post(
      `${API_CONFIG.BASE_URL}/api/vendor/profile`,
      profileData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Vendor profile created:', response.data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('❌ Create Vendor Profile Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create vendor profile',
    };
  }
};

/**
 * Get vendor profile
 * GET /api/vendor/profile
 */
export const getVendorProfile = async () => {
  try {
    const token = await getAccessToken();
    
    if (!token) {
      return {
        success: false,
        error: 'No access token found',
      };
    }
    
    const response = await axios.get(
      `${API_CONFIG.BASE_URL}/api/vendor/profile`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Get Vendor Profile Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to get vendor profile',
    };
  }
};

/**
 * Update vendor profile
 * PUT /api/vendor/profile
 */
export const updateVendorProfile = async (updates) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios.put(
      `${API_CONFIG.BASE_URL}/api/vendor/profile`,
      updates,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Update Vendor Profile Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update vendor profile',
    };
  } 
};
