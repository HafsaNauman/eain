// routes/booking.routes.js
// Customer-facing booking routes — gated behind FEATURE_SERVICE_PROVIDER flag

import express from 'express';
import { requireFeature } from '../middlewares/featureFlag.js';
import { verifyJWT, verifyJWTOptional } from '../middlewares/authJwt.js';
import {
  createBooking,
  getMyBookings,
  getBookingDetails,
  cancelBooking,
} from '../controllers/booking.controller.js';
import { getPublicAvailability } from '../controllers/serviceAvailability.controller.js';

const router = express.Router();

router.use(requireFeature('SERVICE_PROVIDER'));

// Customer booking actions (require login)
router.post('/', verifyJWT, createBooking);
router.get('/my', verifyJWT, getMyBookings);
router.get('/:bookingId', verifyJWT, getBookingDetails);
router.put('/:bookingId/cancel', verifyJWT, cancelBooking);

// Public: view provider availability (no login needed)
router.get('/providers/:vendorId/availability', verifyJWTOptional, getPublicAvailability);

export default router;
