/**
 * Listing Service - Product/Service Listing Management
 */

import axios from 'axios';
import API_CONFIG from './config';
import { getAccessToken } from '../utils/storage';

/**
 * Create listing
 * POST /api/vendor/listings
 */
export const createListing = async (listingData) => {
  try {
    const token = await getAccessToken();
    
    console.log('🔑 Creating listing with token:', token?.substring(0, 30) + '...');
    
    if (!token) {
      return {
        success: false,
        error: 'No access token found. Please login again.',
      };
    }

    const response = await axios.post(
      `${API_CONFIG.BASE_URL}/api/vendor/listings`,
      listingData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Listing created successfully:', response.data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('❌ Create Listing Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create listing',
    };
  }
};

/**
 * Get vendor listings
 * GET /api/vendor/listings
 */
export const getVendorListings = async () => {
  try {
    const token = await getAccessToken();
    
    if (!token) {
      return {
        success: false,
        error: 'No access token found',
      };
    }

    const response = await axios.get(
      `${API_CONFIG.BASE_URL}/api/vendor/listings`,
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
    console.error('Get Vendor Listings Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to get listings',
    };
  }
};

/**
 * Update listing
 * PUT /api/vendor/listings/:id
 */
export const updateListing = async (listingId, updates) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios.put(
      `${API_CONFIG.BASE_URL}/api/vendor/listings/${listingId}`,
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
    console.error('Update Listing Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to update listing',
    };
  }
};
