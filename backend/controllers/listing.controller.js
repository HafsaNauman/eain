// controllers/listing.controller.js
import { Listing, VendorProfile } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/responseBuilder.js';

/**
 * POST /api/vendor/listings
 * Create a new listing
 */
export const createListing = async (req, res) => {
  try {
    const userId = req.userId;

    // Check if user has vendor profile
    const vendorProfile = await VendorProfile.findOne({ where: { user_id: userId } });
    if (!vendorProfile) {
      return errorResponse(res, 404, 'Vendor profile not found. Please complete vendor onboarding first.');
    }

    const {
      listing_type,
      title_en,
      title_ur,
      description_en,// this has to be taken fromproduction description api 
      description_ur,
      price,
      currency,
      category,
      tags,
      media,
      is_female_only,
    } = req.body;

    // Validate required fields
    if (!listing_type || !title_en) {
      return errorResponse(res, 400, 'Listing type and title (English) are required');
    }

    const city = vendorProfile?.city || null;

    const listing = await Listing.create({
      vendor_id: vendorProfile.vendor_id,
      city,
      listing_type,
      title_en,
      title_ur,
      description_en,
      description_ur,
      price,
      currency: currency || 'PKR',
      category,
      tags,
      media,
      is_female_only: is_female_only !== undefined ? is_female_only : false,
    });

    return successResponse(res, 201, 'Listing created successfully', { listing });
  } catch (error) {
    console.error('Create Listing Error:', error);
    return errorResponse(res, 500, 'Failed to create listing', error.message);
  }
};

/**
 * GET /api/vendor/listings
 * Get all listings for current vendor
 */
export const getVendorListings = async (req, res) => {
  try {
    const userId = req.userId;

    const vendorProfile = await VendorProfile.findOne({ where: { user_id: userId } });
    if (!vendorProfile) {
      return errorResponse(res, 404, 'Vendor profile not found');
    }

    const listings = await Listing.findAll({
      where: { vendor_id: vendorProfile.vendor_id },
      order: [['created_at', 'DESC']],
    });

    return successResponse(res, 200, 'Listings retrieved successfully', { listings });
  } catch (error) {
    console.error('Get Vendor Listings Error:', error);
    return errorResponse(res, 500, 'Failed to get listings', error.message);
  }
};

/**
 * PUT /api/vendor/listings/:id
 * Update a listing by ID
 */
export const updateListing = async (req, res) => {
  try {
    const userId = req.userId;
    const listingId = req.params.id;

    // Get vendor profile
    const vendorProfile = await VendorProfile.findOne({ where: { user_id: userId } });
    if (!vendorProfile) {
      return errorResponse(res, 404, 'Vendor profile not found');
    }

    // Update only if listing belongs to this vendor
    const [count, [listing]] = await Listing.update(req.body, {
      where: {
        listing_id: listingId,
        vendor_id: vendorProfile.vendor_id,
      },
      returning: true,
    });

    if (count === 0) {
      return errorResponse(res, 404, 'Listing not found or you do not have permission to update it');
    }

    return successResponse(res, 200, 'Listing updated successfully', { listing });
  } catch (error) {
    console.error('Update Listing Error:', error);
    return errorResponse(res, 500, 'Failed to update listing', error.message);
  }
};
