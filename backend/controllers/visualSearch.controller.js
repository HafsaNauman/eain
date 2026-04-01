// controllers/visualSearch.controller.js - COMPLETE FIXED VERSION
import axios from 'axios';
import FormData from 'form-data'; // npm install form-data
import { Listing, VendorProfile, User } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/responseBuilder.js';
import { Op } from 'sequelize';

// const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_SERVICE_URL = process.env.ML_SERVICE_URL;
console.log('🚀 ML_SERVICE_URL:', ML_SERVICE_URL);

export const visualSearch = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'Image file required');
    }

    console.log('🔍 Visual search - file:', req.file.originalname, req.file.mimetype);

    // 1. Check ML service health
    try {
      const health = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
      console.log('✅ ML service healthy:', health.data);
      
      if (health.data.vectors_indexed === 0) {
        return errorResponse(res, 503, 'Index empty - run: node scripts/index-listings-ml.js');
      }
    } catch (healthErr) {
      console.error('❌ ML service DOWN:', healthErr.message);
      return errorResponse(res, 503, 'ML service unavailable at ' + ML_SERVICE_URL);
    }

    // 2. Call visual search - FIXED FormData
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype || 'image/jpeg'
    });
    formData.append('top_k', '20');

    console.log('🚀 Calling ML visual-search...');
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/visual-search`, formData, {
      headers: formData.getHeaders(),
      timeout: 20000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('✅ ML response:', JSON.stringify(mlResponse.data, null, 2));

    const validResults = mlResponse.data.results?.filter(r => r.listing_id) || [];
    console.log(`📊 ${validResults.length} valid listing_ids`);

    if (validResults.length === 0) {
      return successResponse(res, 200, 'No matching listings', {
        total: 0,
        listings: [],
        pagination: { limit: 0, offset: 0, hasMore: false }
      });
    }

    // 3. Enrich with DB data
    const listingIds = validResults.map(r => parseInt(r.listing_id));
    const isFemale = req.userGender && req.userGender.toLowerCase() === 'female';

    const listings = await Listing.findAll({
      where: {
        listing_id: { [Op.in]: listingIds },
        is_active: true,
        ...(isFemale ? {} : { is_female_only: false })
      },
      include: [{
        model: VendorProfile,
        as: 'Vendor',
        where: { is_active: true },
        attributes: ['vendor_id', 'business_name_en', 'business_name_ur', 'city', 'area', 'media'],
        required: true
      }],
      limit: 10
    });

    console.log(`✅ Found ${listings.length} enriched listings`);

    return successResponse(res, 200, 'Visual search results', {
      total: listings.length,
      listings,
      pagination: { limit: 10, offset: 0, hasMore: false }
    });

  } catch (error) {
    console.error('🔥 Visual search FULL ERROR:');
    console.error('- message:', error.message);
    console.error('- code:', error.code);
    console.error('- status:', error.response?.status);
    console.error('- data:', JSON.stringify(error.response?.data));
    console.error('- ML_URL:', ML_SERVICE_URL);
    
    if (error.code === 'ECONNREFUSED') {
      return errorResponse(res, 503, 'ML service not running on ' + ML_SERVICE_URL);
    }
    
    return errorResponse(res, 500, 'Visual search failed: ' + error.message);
  }
};
