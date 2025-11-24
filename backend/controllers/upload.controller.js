// controllers/upload.controller.js
import supabase from '../config/supabase.js';
import fs from 'fs';
import { successResponse, errorResponse } from '../utils/responseBuilder.js';

/**
 * POST /api/upload/vendor-image
 * Upload vendor image to Supabase Storage
 */
export const uploadVendorImage = async (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      return errorResponse(res, 400, 'No file uploaded');
    }

    // Read file buffer
    const fileBuffer = fs.readFileSync(file.path);
    const fileExt = file.originalname.split('.').pop();
    const fileName = `vendor-${Date.now()}.${fileExt}`;

    // Upload to Supabase storage bucket 'vendor-images'
    const { error } = await supabase.storage
      .from('vendor-images')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
      });

    if (error) {
      console.error('Supabase Upload Error:', error);
      return errorResponse(res, 500, 'Failed to upload image to storage', error.message);
    }

    // Get public URL
    const { data } = supabase.storage
      .from('vendor-images')
      .getPublicUrl(fileName);

    // Delete temp file
    fs.unlinkSync(file.path);

    return successResponse(res, 200, 'Image uploaded successfully', {
      image_url: data.publicUrl,
    });
  } catch (error) {
    console.error('Upload Image Error:', error);
    return errorResponse(res, 500, 'Failed to upload image', error.message);
  }
};
