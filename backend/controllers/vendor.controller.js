// controllers/vendor.controller.js
import { VendorProfile } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/responseBuilder.js';

/**
 * GET /api/vendor/profile
 * Get current user's vendor profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.userId; // From JWT middleware

    const profile = await VendorProfile.findOne({ where: { user_id: userId } });

    if (!profile) {
      return errorResponse(res, 404, 'Vendor profile not found');
    }

    return successResponse(res, 200, 'Vendor profile retrieved', { profile });
  } catch (error) {
    console.error('Get Vendor Profile Error:', error);
    return errorResponse(res, 500, 'Failed to get vendor profile', error.message);
  }
};

/**
 * POST /api/vendor/profile
 * Create or update vendor profile (upsert for Step 1)
 */
export const createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      vendor_type,
      business_name_en,
      business_name_ur,
      description_en,
      description_ur,
      category,
      city,
      area,
      location,
      is_female_only,
      media,
    } = req.body;
    console.log("VENDOR PROFILE CONTROLLER: Media:", media);
    // Validate required fields
    if (!business_name_en || !vendor_type) {
      return errorResponse(res, 400, 'Business name (English) and vendor type are required');
    }

    // Upsert (create if not exists, update if exists)
    const [profile, created] = await VendorProfile.upsert(
      {
        user_id: userId,
        vendor_type,
        business_name_en,
        business_name_ur,
        description_en,
        description_ur,
        category,
        city,
        area,
        location,
        // is_female_only: is_female_only !== undefined ? is_female_only : true,
        is_female_only: is_female_only !== undefined ? is_female_only : false,

        media,
      },
      {
        returning: true,
      }
    );

    return successResponse(
      res,
      created ? 201 : 200,
      created ? 'Vendor profile created successfully' : 'Vendor profile updated successfully',
      { profile, created }
    );
  } catch (error) {
    console.error('Create/Update Vendor Profile Error:', error);
    return errorResponse(res, 500, 'Failed to create/update vendor profile', error.message);
  }
};

/**
 * PUT /api/vendor/profile
 * Update vendor profile (for Steps 2-4 and general updates)
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const updates = req.body;

    const [count, [profile]] = await VendorProfile.update(updates, {
      where: { user_id: userId },
      returning: true,
    });

    if (count === 0) {
      return errorResponse(res, 404, 'Vendor profile not found');
    }

    return successResponse(res, 200, 'Vendor profile updated successfully', { profile });
  } catch (error) {
    console.error('Update Vendor Profile Error:', error);
    return errorResponse(res, 500, 'Failed to update vendor profile', error.message);
  }
};
