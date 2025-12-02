/**
 * Upload Service
 * Handle image uploads to Supabase via backend
 */
import apiClient from './client';

/**
 * Upload vendor image (logo/cover) to Supabase
 * @param {string} imageUri - Local file URI from ImagePicker
 * @param {string} imageType - 'logo' or 'cover'
 * @returns {Promise} Supabase public URL
 */
export const uploadVendorImage = async (imageUri, imageType = 'logo') => {
    try {
        console.log('📤 Uploading vendor image to Supabase...', imageType);

        // Create FormData for multipart upload
        const formData = new FormData();

        // Extract filename from URI
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        // Append image file
        formData.append('image', {
            uri: imageUri,
            name: filename || `vendor-${Date.now()}.jpg`,
            type: type,
        });

        formData.append('imageType', imageType);

        // Upload to backend
        const response = await apiClient.post('/api/upload/vendor-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 60000, // 60 seconds for image upload
        });

        if (response.data.success) {
            const supabaseUrl = response.data.data.image_url;
            console.log('✅ uPLOADSERVICE.JS Image uploaded to Supabase:', supabaseUrl);
            return {
                success: true,
                imageUrl: supabaseUrl,
            };
        } else {
            return {
                success: false,
                error: response.data.message || 'Upload failed',
            };
        }
    } catch (error) {
        console.error('❌ Upload Vendor Image Error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to upload image',
        };
    }
};

/**
 * Upload product image to Supabase
 * @param {string} imageUri - Local file URI from ImagePicker
 * @returns {Promise} Supabase public URL
 */
export const uploadProductImage = async (imageUri) => {
    try {
        console.log('📤 Uploading product image to Supabase...');

        const formData = new FormData();

        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
            uri: imageUri,
            name: filename || `product-${Date.now()}.jpg`,
            type: type,
        });

        const response = await apiClient.post('/api/upload/product-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 60000,
        });

        if (response.data.success) {
            const supabaseUrl = response.data.data.image_url;
            console.log('✅ Product image uploaded:', supabaseUrl);
            return {
                success: true,
                imageUrl: supabaseUrl,
            };
        } else {
            return {
                success: false,
                error: response.data.message || 'Upload failed',
            };
        }
    } catch (error) {
        console.error('❌ Upload Product Image Error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to upload image',
        };
    }
};

/**
 * Upload multiple product images sequentially
 * @param {Array} imageUris - Array of local file URIs
 * @returns {Promise} Array of Supabase URLs
 */
export const uploadMultipleProductImages = async (imageUris) => {
    try {
        console.log(`📤 Uploading ${imageUris.length} product images...`);

        const uploadedUrls = [];
        const errors = [];

        // Upload one by one to avoid overwhelming the server
        for (let i = 0; i < imageUris.length; i++) {
            const uri = imageUris[i];
            console.log(`📤 Uploading image ${i + 1}/${imageUris.length}...`);

            const result = await uploadProductImage(uri);

            if (result.success) {
                uploadedUrls.push(result.imageUrl);
            } else {
                errors.push({ uri, error: result.error });
            }
        }

        if (errors.length > 0) {
            console.warn(`⚠️ ${errors.length} uploads failed:`, errors);
        }

        return {
            success: uploadedUrls.length > 0,
            imageUrls: uploadedUrls,
            failedCount: errors.length,
            errors,
        };
    } catch (error) {
        console.error('❌ Upload Multiple Images Error:', error);
        return {
            success: false,
            error: error.message,
            imageUrls: [],
            failedCount: imageUris.length,
        };
    }
};
