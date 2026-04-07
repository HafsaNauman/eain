// controllers/booking.controller.js
// Handles booking flow: Customer books → Provider approves → Completed

import { Booking, VendorProfile, Listing, User } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/responseBuilder.js';
import { Op } from 'sequelize';

// ──────────────────────────────────────────────
// POST /api/bookings
// Customer: Create a booking
// ──────────────────────────────────────────────
export const createBooking = async (req, res) => {
  try {
    const customerId = req.userId;
    const {
      vendor_id,
      listing_id,
      slot_date,
      slot_time,
      duration_mins,
      customer_phone,
      address,
      city,
      notes,
      payment_method,
    } = req.body;

    if (!vendor_id || !slot_date || !slot_time || !customer_phone) {
      return errorResponse(res, 400, 'vendor_id, slot_date, slot_time, customer_phone are required');
    }

    // Verify vendor exists and is a service provider
    const vendor = await VendorProfile.findOne({
      where: {
        vendor_id,
        is_active: true,
        vendor_type: { [Op.in]: ['service', 'both'] },
      },
    });

    if (!vendor) {
      return errorResponse(res, 404, 'Service provider not found or inactive');
    }

    // Check for slot conflict
    const conflict = await Booking.findOne({
      where: {
        vendor_id,
        slot_date,
        slot_time,
        status: { [Op.in]: ['pending', 'confirmed', 'in_progress'] },
      },
    });

    if (conflict) {
      return errorResponse(res, 409, 'This time slot is already booked. Please choose another.');
    }

    // Get price from listing if provided
    let totalAmount = null;
    if (listing_id) {
      const listing = await Listing.findByPk(listing_id, {
        attributes: ['listing_id', 'price', 'is_active'],
      });
      if (listing && listing.is_active) {
        totalAmount = listing.price || null;
      }
    }

    const booking = await Booking.create({
      customer_id: customerId,
      vendor_id,
      listing_id: listing_id || null,
      slot_date,
      slot_time,
      duration_mins: duration_mins || 60,
      status: 'pending',
      total_amount: totalAmount,
      customer_phone,
      address: address || null,
      city: city || null,
      notes: notes || null,
      payment_method: payment_method || null,
      payment_status: 'pending',
    });

    return successResponse(res, 201, 'Booking request sent. Waiting for provider confirmation.', {
      booking,
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create booking', error.message);
  }
};

// ──────────────────────────────────────────────
// GET /api/bookings/my
// Customer: Get own bookings
// ──────────────────────────────────────────────
export const getMyBookings = async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const where = { customer_id: req.userId };
    if (status) where.status = status;

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [
        {
          model: VendorProfile,
          as: 'serviceProvider',
          attributes: ['vendor_id', 'business_name_en', 'city', 'media'],
        },
        {
          model: Listing,
          as: 'serviceListing',
          attributes: ['listing_id', 'title_en', 'price', 'media'],
          required: false,
        },
      ],
      order: [['slot_date', 'DESC'], ['slot_time', 'DESC']],
      limit: Math.min(parseInt(limit), 50),
      offset: parseInt(offset),
    });

    return successResponse(res, 200, 'Bookings retrieved', {
      total: count,
      bookings: rows,
      pagination: { limit, offset, hasMore: parseInt(offset) + rows.length < count },
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to get bookings', error.message);
  }
};

// ──────────────────────────────────────────────
// GET /api/bookings/:bookingId
// Customer or Provider: Get booking details
// ──────────────────────────────────────────────
export const getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.bookingId, {
      include: [
        { model: User, as: 'customer', attributes: ['user_id', 'full_name', 'phone_number'] },
        { model: VendorProfile, as: 'serviceProvider', attributes: ['vendor_id', 'business_name_en', 'city'] },
        { model: Listing, as: 'serviceListing', attributes: ['listing_id', 'title_en', 'price'], required: false },
      ],
    });

    if (!booking) return errorResponse(res, 404, 'Booking not found');

    // Access control: only customer or the vendor can view
    const vendorProfile = await VendorProfile.findOne({ where: { user_id: req.userId } });
    const isOwner = booking.customer_id === req.userId;
    const isProvider = vendorProfile && booking.vendor_id === vendorProfile.vendor_id;

    if (!isOwner && !isProvider && req.userRole !== 'admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    return successResponse(res, 200, 'Booking details retrieved', { booking });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to get booking', error.message);
  }
};

// ──────────────────────────────────────────────
// PUT /api/bookings/:bookingId/cancel
// Customer: Cancel own booking
// ──────────────────────────────────────────────
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      where: { booking_id: req.params.bookingId, customer_id: req.userId },
    });

    if (!booking) return errorResponse(res, 404, 'Booking not found');

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return errorResponse(res, 400, `Cannot cancel a booking with status: ${booking.status}`);
    }

    await booking.update({
      status: 'cancelled',
      cancellation_reason: req.body.reason || null,
      cancelled_by: 'customer',
      cancelled_at: new Date(),
    });

    return successResponse(res, 200, 'Booking cancelled', { booking });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to cancel booking', error.message);
  }
};

// ──────────────────────────────────────────────
// GET /api/service/bookings
// Provider: Get all incoming bookings
// ──────────────────────────────────────────────
export const getProviderBookings = async (req, res) => {
  try {
    const profile = await VendorProfile.findOne({ where: { user_id: req.userId } });
    if (!profile) return errorResponse(res, 404, 'Service profile not found');

    const { status, date, limit = 20, offset = 0 } = req.query;
    const where = { vendor_id: profile.vendor_id };
    if (status) where.status = status;
    if (date) where.slot_date = date;

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [
        { model: User, as: 'customer', attributes: ['user_id', 'full_name', 'phone_number', 'email'] },
        { model: Listing, as: 'serviceListing', attributes: ['listing_id', 'title_en', 'price'], required: false },
      ],
      order: [['slot_date', 'ASC'], ['slot_time', 'ASC']],
      limit: Math.min(parseInt(limit), 50),
      offset: parseInt(offset),
    });

    return successResponse(res, 200, 'Bookings retrieved', {
      total: count,
      bookings: rows,
      pagination: { limit, offset, hasMore: parseInt(offset) + rows.length < count },
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to get bookings', error.message);
  }
};

// ──────────────────────────────────────────────
// PUT /api/service/bookings/:bookingId/confirm
// Provider: Confirm a pending booking
// ──────────────────────────────────────────────
export const confirmBooking = async (req, res) => {
  try {
    const profile = await VendorProfile.findOne({ where: { user_id: req.userId } });
    if (!profile) return errorResponse(res, 404, 'Service profile not found');

    const booking = await Booking.findOne({
      where: { booking_id: req.params.bookingId, vendor_id: profile.vendor_id },
    });

    if (!booking) return errorResponse(res, 404, 'Booking not found');
    if (booking.status !== 'pending') {
      return errorResponse(res, 400, `Booking is already ${booking.status}`);
    }

    await booking.update({
      status: 'confirmed',
      confirmed_at: new Date(),
      total_amount: req.body.total_amount || booking.total_amount,
    });

    return successResponse(res, 200, 'Booking confirmed', { booking });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to confirm booking', error.message);
  }
};

// ──────────────────────────────────────────────
// PUT /api/service/bookings/:bookingId/reject
// Provider: Reject a pending booking
// ──────────────────────────────────────────────
export const rejectBooking = async (req, res) => {
  try {
    const profile = await VendorProfile.findOne({ where: { user_id: req.userId } });
    if (!profile) return errorResponse(res, 404, 'Service profile not found');

    const booking = await Booking.findOne({
      where: { booking_id: req.params.bookingId, vendor_id: profile.vendor_id },
    });

    if (!booking) return errorResponse(res, 404, 'Booking not found');
    if (booking.status !== 'pending') {
      return errorResponse(res, 400, `Cannot reject a booking with status: ${booking.status}`);
    }

    await booking.update({
      status: 'rejected',
      rejection_reason: req.body.reason || null,
      rejected_at: new Date(),
    });

    return successResponse(res, 200, 'Booking rejected', { booking });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to reject booking', error.message);
  }
};

// ──────────────────────────────────────────────
// PUT /api/service/bookings/:bookingId/complete
// Provider: Mark booking as completed
// ──────────────────────────────────────────────
export const completeBooking = async (req, res) => {
  try {
    const profile = await VendorProfile.findOne({ where: { user_id: req.userId } });
    if (!profile) return errorResponse(res, 404, 'Service profile not found');

    const booking = await Booking.findOne({
      where: { booking_id: req.params.bookingId, vendor_id: profile.vendor_id },
    });

    if (!booking) return errorResponse(res, 404, 'Booking not found');
    if (!['confirmed', 'in_progress'].includes(booking.status)) {
      return errorResponse(res, 400, `Cannot complete a booking with status: ${booking.status}`);
    }

    await booking.update({
      status: 'completed',
      completed_at: new Date(),
      payment_status: req.body.payment_status || booking.payment_status,
    });

    return successResponse(res, 200, 'Booking marked as completed', { booking });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to complete booking', error.message);
  }
};

// ──────────────────────────────────────────────
// PUT /api/service/bookings/:bookingId/cancel
// Provider: Cancel a confirmed booking
// ──────────────────────────────────────────────
export const providerCancelBooking = async (req, res) => {
  try {
    const profile = await VendorProfile.findOne({ where: { user_id: req.userId } });
    if (!profile) return errorResponse(res, 404, 'Service profile not found');

    const booking = await Booking.findOne({
      where: { booking_id: req.params.bookingId, vendor_id: profile.vendor_id },
    });

    if (!booking) return errorResponse(res, 404, 'Booking not found');
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return errorResponse(res, 400, `Cannot cancel a booking with status: ${booking.status}`);
    }

    await booking.update({
      status: 'cancelled',
      cancellation_reason: req.body.reason || null,
      cancelled_by: 'vendor',
      cancelled_at: new Date(),
    });

    return successResponse(res, 200, 'Booking cancelled', { booking });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to cancel booking', error.message);
  }
};
