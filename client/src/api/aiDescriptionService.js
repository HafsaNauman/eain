// /**
//  * AI Description Service
//  * Handles AI-powered product description generation from images
//  */

// import API_CONFIG from './config';
// import apiClient from './client';

// /**
//  * Generate product description from image using AI
//  * @param {Object} imageFile - Image file object from expo-image-picker
//  * @param {number} vendorId - Vendor ID (optional)
//  * @param {boolean} saveToDb - Whether to save to database (optional)
//  * @returns {Promise<Object>} AI-generated description data
//  */
// export const generateProductDescription = async (imageFile, vendorId = null, saveToDb = false) => {
//     try {
//         console.log('📤 Generating AI description for image:', imageFile.uri);

//         // Create FormData for multipart upload
//         const formData = new FormData();

//         // Append image file
//         formData.append('image', {
//             uri: imageFile.uri,
//             type: imageFile.type || 'image/jpeg',
//             name: imageFile.fileName || 'product-image.jpg',
//         });

//         // Optional parameters
//         if (vendorId) {
//             formData.append('vendor_id', vendorId.toString());
//         }
//         if (saveToDb) {
//             formData.append('save_to_db', 'true');
//         }

//         // Make API request
//         const response = await apiClient.post(
//             API_CONFIG.ENDPOINTS.AI.GENERATE_PRODUCT_DESCRIPTION,
//             formData,
//             {
//                 headers: {
//                     'Content-Type': 'multipart/form-data',
//                 },
//                 timeout: 45000, // 45 seconds for AI processing
//             }
//         );

//         if (response.data.success) {
//             console.log('✅ AI Description generated successfully');
//             return {
//                 success: true,
//                 data: response.data.data,
//             };
//         } else {
//             console.error('❌ AI Description generation failed:', response.data.error);
//             return {
//                 success: false,
//                 error: response.data.error || 'Failed to generate description',
//             };
//         }
//     } catch (error) {
//         console.error('❌ AI Description Service Error:', error);

//         if (error.code === 'ECONNABORTED') {
//             return {
//                 success: false,
//                 error: 'Request timeout. AI service took too long to respond.',
//             };
//         }

//         if (error.response?.status === 503) {
//             return {
//                 success: false,
//                 error: 'AI service is currently unavailable. Please try again later.',
//             };
//         }

//         return {
//             success: false,
//             error: error.response?.data?.error || error.message || 'Failed to generate description',
//         };
//     }
// };

// /**
//  * Update existing listing with AI-generated description
//  * @param {number} listingId - Listing ID to update
//  * @param {Object} imageFile - Image file object from expo-image-picker
//  * @returns {Promise<Object>} Updated listing data
//  */
// export const updateListingWithAI = async (listingId, imageFile) => {
//     try {
//         console.log(`📤 Updating listing ${listingId} with AI description`);

//         const formData = new FormData();
//         formData.append('image', {
//             uri: imageFile.uri,
//             type: imageFile.type || 'image/jpeg',
//             name: imageFile.fileName || 'product-image.jpg',
//         });

//         const response = await apiClient.put(
//             API_CONFIG.ENDPOINTS.AI.UPDATE_LISTING_WITH_AI.replace(':listing_id', listingId),
//             formData,
//             {
//                 headers: {
//                     'Content-Type': 'multipart/form-data',
//                 },
//                 timeout: 45000,
//             }
//         );

//         if (response.data.success) {
//             console.log('✅ Listing updated with AI description');
//             return {
//                 success: true,
//                 data: response.data.data,
//             };
//         } else {
//             return {
//                 success: false,
//                 error: response.data.error || 'Failed to update listing',
//             };
//         }
//     } catch (error) {
//         console.error('❌ Update Listing Error:', error);
//         return {
//             success: false,
//             error: error.response?.data?.error || error.message || 'Failed to update listing',
//         };
//     }
// };


/**
 * AI Description Service
 * Handles AI-powered product description generation from images
 */
import API_CONFIG from './config';
import apiClient from './client';
import { Platform } from 'react-native';

/**
 * Generate product description from image using AI
 * @param {Object} imageFile - Image file object from expo-image-picker
 * @param {number} vendorId - Vendor ID (optional)
 * @param {boolean} saveToDb - Whether to save to database (optional)
 * @returns {Promise} AI-generated description data
 */
export const generateProductDescription = async (imageFile, vendorId = null, saveToDb = false) => {
    try {
        console.log('📤 Generating AI description for image:', imageFile.uri);

        // Create FormData for multipart upload
        const formData = new FormData();

        // React Native requires a specific structure for file uploads
        const imageObject = {
            uri: Platform.OS === 'android' ? imageFile.uri : imageFile.uri.replace('file://', ''),
            type: imageFile.mimeType || imageFile.type || 'image/jpeg',
            name: imageFile.fileName || `product-${Date.now()}.jpg`,
        };

        console.log('📎 Image object:', imageObject);

        // Append image file - use 'image' to match multer config upload.single('image')
        formData.append('image', imageObject);

        // Optional parameters
        if (vendorId) {
            formData.append('vendor_id', vendorId.toString());
        }

        if (saveToDb) {
            formData.append('save_to_db', 'true');
        }

        console.log('📤 Sending FormData to backend...');

        // Make API request
        const response = await apiClient.post(
            API_CONFIG.ENDPOINTS.AI.GENERATE_PRODUCT_DESCRIPTION,
            formData,
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data',
                },
                transformRequest: (data, headers) => {
                    // Return FormData as-is for React Native
                    return data;
                },
                timeout: 45000, // 45 seconds for AI processing
            }
        );

        if (response.data.success) {
            console.log('✅ AI Description generated successfully');
            return {
                success: true,
                data: response.data.data,
            };
        } else {
            console.error('❌ AI Description generation failed:', response.data.error);
            return {
                success: false,
                error: response.data.error || 'Failed to generate description',
            };
        }
    } catch (error) {
        console.warn('❌ AI Description Service Error:', error.message);
        console.warn('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
        });

        if (error.code === 'ECONNABORTED') {
            return {
                success: false,
                error: 'Request timeout. AI service took too long to respond.',
            };
        }

        if (error.response?.status === 503) {
            return {
                success: false,
                error: 'AI service is currently unavailable. Please try again later.',
            };
        }

        if (error.response?.status === 400) {
            return {
                success: false,
                error: error.response?.data?.message || 'Invalid image file. Please try again.',
            };
        }

        return {
            success: false,
            error: error.response?.data?.error || error.message || 'Failed to generate description',
        };
    }
};

/**
 * Update existing listing with AI-generated description
 * @param {number} listingId - Listing ID to update
 * @param {Object} imageFile - Image file object from expo-image-picker
 * @returns {Promise} Updated listing data
 */
export const updateListingWithAI = async (listingId, imageFile) => {
    try {
        console.log(`📤 Updating listing ${listingId} with AI description`);

        const formData = new FormData();

        const imageObject = {
            uri: Platform.OS === 'android' ? imageFile.uri : imageFile.uri.replace('file://', ''),
            type: imageFile.mimeType || imageFile.type || 'image/jpeg',
            name: imageFile.fileName || `product-${Date.now()}.jpg`,
        };

        formData.append('image', imageObject);

        const response = await apiClient.put(
            API_CONFIG.ENDPOINTS.AI.UPDATE_LISTING_WITH_AI.replace(':listing_id', listingId),
            formData,
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data',
                },
                transformRequest: (data, headers) => {
                    return data;
                },
                timeout: 45000,
            }
        );

        if (response.data.success) {
            console.log('✅ Listing updated with AI description');
            return {
                success: true,
                data: response.data.data,
            };
        } else {
            return {
                success: false,
                error: response.data.error || 'Failed to update listing',
            };
        }
    } catch (error) {
        console.warn('❌ Update Listing Error:', error.message);
        return {
            success: false,
            error: error.response?.data?.error || error.message || 'Failed to update listing',
        };
    }
};
