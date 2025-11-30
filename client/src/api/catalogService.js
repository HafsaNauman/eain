/**
 * Catalog Service
 * Public endpoints for browsing listings (no auth required)
 */
import API_CONFIG from './config';
import apiClient from './client';

/**
 * Get all active listings with optional filters
 * @param {Object} params - Query parameters
 * @param {string} params.q - Search query
 * @param {string} params.city - Filter by city
 * @param {number} params.limit - Results per page (default: 20)
 * @param {number} params.offset - Pagination offset
 * @returns {Promise} Listings data
 */
export const getAllListings = async (params = {}) => {
    try {
        const { q, city, limit = 20, offset = 0 } = params;

        const queryParams = new URLSearchParams();
        queryParams.append('limit', limit.toString());
        queryParams.append('offset', offset.toString());

        if (q) queryParams.append('q', q);
        if (city) queryParams.append('city', city);

        console.log(`📤 GET ${API_CONFIG.ENDPOINTS.CATALOG.LISTINGS}?${queryParams.toString()}`);

        const response = await apiClient.get(
            `${API_CONFIG.ENDPOINTS.CATALOG.LISTINGS}?${queryParams.toString()}`
        );

        if (response.data.success) {
            console.log(`✅ Loaded ${response.data.data.listings.length} listings`);
            return {
                success: true,
                data: response.data.data,
            };
        } else {
            return {
                success: false,
                error: response.data.message || 'Failed to load listings',
            };
        }
    } catch (error) {
        console.error('❌ Get All Listings Error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to load listings',
        };
    }
};

/**
 * Get details of a single listing
 * @param {number} listingId - Listing ID
 * @returns {Promise} Listing details
 */
export const getListingDetails = async (listingId) => {
    try {
        console.log(`📤 GET /api/catalog/listings/${listingId}`);

        const response = await apiClient.get(
            API_CONFIG.ENDPOINTS.CATALOG.LISTING_DETAILS.replace(':listing_id', listingId)
        );

        if (response.data.success) {
            console.log('✅ Listing details loaded');
            return {
                success: true,
                data: response.data.data.listing,
            };
        } else {
            return {
                success: false,
                error: response.data.message || 'Failed to load listing details',
            };
        }
    } catch (error) {
        console.error('❌ Get Listing Details Error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to load listing',
        };
    }
};

/**
 * Search listings with advanced filters
 * @param {Object} filters - Search filters
 * @returns {Promise} Search results
 */
export const searchListings = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                queryParams.append(key, value.toString());
            }
        });

        console.log(`📤 GET /api/catalog/search?${queryParams.toString()}`);

        const response = await apiClient.get(
            `${API_CONFIG.ENDPOINTS.CATALOG.SEARCH}?${queryParams.toString()}`
        );

        if (response.data.success) {
            console.log(`✅ Search returned ${response.data.data.listings.length} results`);
            return {
                success: true,
                data: response.data.data,
            };
        } else {
            return {
                success: false,
                error: response.data.message || 'Search failed',
            };
        }
    } catch (error) {
        console.error('❌ Search Listings Error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Search failed',
        };
    }
};

/**
 * Get all listings from a specific vendor
 * @param {number} vendorId - Vendor ID
 * @param {Object} params - Pagination params
 * @returns {Promise} Vendor listings
 */
export const getVendorListings = async (vendorId, params = {}) => {
    try {
        const { limit = 20, offset = 0 } = params;

        const queryParams = new URLSearchParams();
        queryParams.append('limit', limit.toString());
        queryParams.append('offset', offset.toString());

        const url = API_CONFIG.ENDPOINTS.CATALOG.VENDOR_LISTINGS
            .replace(':vendor_id', vendorId);

        console.log(`📤 GET ${url}?${queryParams.toString()}`);

        const response = await apiClient.get(`${url}?${queryParams.toString()}`);

        if (response.data.success) {
            console.log(`✅ Loaded vendor listings`);
            return {
                success: true,
                data: response.data.data,
            };
        } else {
            return {
                success: false,
                error: response.data.message || 'Failed to load vendor listings',
            };
        }
    } catch (error) {
        console.error('❌ Get Vendor Listings Error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to load vendor listings',
        };
    }
};
