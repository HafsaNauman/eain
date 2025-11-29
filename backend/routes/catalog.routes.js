
import express from 'express';
import {
    getAllListings,
    getListingDetails,
    getVendorListingsPublic,
    searchListings,
} from '../controllers/catalog.controller.js';

const router = express.Router();

// ===== PUBLIC ROUTES (No authentication required) =====

// GET /api/catalog/listings - Get all active listings (with optional search/filters)
router.get('/listings', getAllListings);

// GET /api/catalog/listings/:listing_id - Get details of a single listing
router.get('/listings/:listing_id', getListingDetails);

// GET /api/catalog/vendors/:vendor_id/listings - Get all listings for a specific vendor
router.get('/vendors/:vendor_id/listings', getVendorListingsPublic);

// GET /api/catalog/search - Advanced search with multiple filters
router.get('/search', searchListings);

export default router;