// routes/listing.routes.js
import express from 'express';
import {
  createListing,
  getVendorListings,
  updateListing,
} from '../controllers/listing.controller.js';
import { verifyJWT } from '../middlewares/authJwt.js';

const router = express.Router();

// All listing routes require authentication
router.use(verifyJWT);

// POST /api/vendor/listings - Create listing
router.post('/', createListing);

// GET /api/vendor/listings - Get all vendor's listings
router.get('/', getVendorListings);

// PUT /api/vendor/listings/:id - Update listing
router.put('/:id', updateListing);

export default router;
