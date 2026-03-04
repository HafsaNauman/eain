import axios from 'axios';
import { Listing, VendorProfile } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/responseBuilder.js';
import { Op } from 'sequelize';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export const visualSearch = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'Image file required');
    }

    // 1. Call ML service
    const mlForm = new FormData();
    mlForm.append('file', req.file.buffer, req.file.originalname);
    mlForm.append('top_k', '20'); // Get extra for filtering

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/visual-search`, mlForm, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    const listingIds = mlResponse.data.results
      .filter(r => r.listing_id) // Valid IDs only
      .map(r => r.listing_id);

    if (listingIds.length === 0) {
      return successResponse(res, 200, 'No matching listings', {
        total: 0,
        listings: [],
        pagination: { limit: 0, offset: 0, hasMore: false }
      });
    }

    // 2. Enrich with DB (same query as text search)
    const isFemale = await canViewFemaleOnly(req.userId); // Reuse your helper

    const listings = await Listing.findAll({
      where: {
        listing_id: { [Op.in]: listingIds },
        is_active: true,
        ...(isFemale ? {} : { is_female_only: false })
      },
      include: [{
        association: 'Vendor',
        model: VendorProfile,
        where: { is_active: true },
        attributes: ['vendor_id', 'business_name_en', 'business_name_ur', 'city', 'area', 'media'],
        required: true
      }],
      order: [['ai_metadata', 'similarity_score', 'DESC']], // If you store scores
      limit: 10
    });

    return successResponse(res, 200, 'Visual search results', {
      total: listings.length,
      listings,
      pagination: { limit: 10, offset: 0, hasMore: false }
    });

  } catch (error) {
    console.error('Visual search error:', error);
    return errorResponse(res, 500, 'Visual search failed', error.message);
  }
};

// Reuse your existing female-only helper from catalog.controller.js
const canViewFemaleOnly = async (userId) => {
  // ... your existing code
};
