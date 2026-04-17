// routes/service.routes.js
// All service provider routes — gated behind FEATURE_SERVICE_PROVIDER flag

import express from 'express';
import { requireFeature } from '../middlewares/featureFlag.js';
import { verifyJWT } from '../middlewares/authJwt.js';
import {
  getServiceProfile,
  createOrUpdateServiceProfile,
  updateServiceProfile,
  getServiceDashboard,
} from '../controllers/service.controller.js';
import {
  getProviderBookings,
  confirmBooking,
  rejectBooking,
  completeBooking,
  providerCancelBooking,
} from '../controllers/booking.controller.js';
import {
  getAvailability,
  setAvailability,
  deleteAvailability,
} from '../controllers/serviceAvailability.controller.js';

const router = express.Router();

// All routes require JWT + feature flag
router.use(verifyJWT);
router.use(requireFeature('SERVICE_PROVIDER'));

// ── Profile ──
router.get('/profile', getServiceProfile);
router.post('/profile', createOrUpdateServiceProfile);
router.put('/profile', updateServiceProfile);

// ── Dashboard (extra flag for finer control) ──
router.get('/dashboard', requireFeature('SERVICE_DASHBOARD'), getServiceDashboard);

// ── Bookings (incoming) ──
router.get('/bookings', getProviderBookings);
router.put('/bookings/:bookingId/confirm', confirmBooking);
router.put('/bookings/:bookingId/reject', rejectBooking);
router.put('/bookings/:bookingId/complete', completeBooking);
router.put('/bookings/:bookingId/cancel', providerCancelBooking);

// ── Availability ──
router.get('/availability', requireFeature('SERVICE_AVAILABILITY'), getAvailability);
router.post('/availability', requireFeature('SERVICE_AVAILABILITY'), setAvailability);
router.delete('/availability/:availabilityId', requireFeature('SERVICE_AVAILABILITY'), deleteAvailability);

export default router;
