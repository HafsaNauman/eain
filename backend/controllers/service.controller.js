// controllers/service.controller.js
// Service Provider profile + dashboard
// Reuses VendorProfile model (vendor_type: 'service')

import { VendorProfile, Booking, Listing, User } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/responseBuilder.js';
import { Op } from 'sequelize';

// ──────────────────────────────────────────────
// GET /api/service/profile
// ──────────────────────────────────────────────
export const getServiceProfile = async (req, res) => {
  try {
    const profile = await VendorProfile.findOne({
      where: { user_id: req.userId },
    });

    if (!profile) {
      return errorResponse(res, 404, 'Service provider profile not found');
    }

    if (profile.vendor_type !== 'service' && profile.vendor_type !== 'both') {
      return errorResponse(res, 403, 'This profile is not a service provider');
    }

    return successResponse(res, 200, 'Profile retrieved', { profile });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to get profile', error.message);
  }
};

// ──────────────────────────────────────────────
// POST /api/service/profile
// Create or update service provider profile
// ──────────────────────────────────────────────
export const createOrUpdateServiceProfile = async (req, res) => {
  try {
    const {
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

    if (!business_name_en) {
      return errorResponse(res, 400, 'Business name (English) is required');
    }

    const [profile, created] = await VendorProfile.upsert({
      user_id: req.userId,
      vendor_type: 'service',   // always 'service' for this route
      business_name_en,
      business_name_ur,
      description_en,
      description_ur,
      category,
      city,
      area,
      location,
      is_female_only: is_female_only ?? false,
      media,
      is_active: true,
    }, { returning: true });

    return successResponse(
      res,
      created ? 201 : 200,
      created ? 'Service profile created' : 'Service profile updated',
      { profile }
    );
  } catch (error) {
    return errorResponse(res, 500, 'Failed to save service profile', error.message);
  }
};

// ──────────────────────────────────────────────
// PUT /api/service/profile
// ──────────────────────────────────────────────
export const updateServiceProfile = async (req, res) => {
  try {
    const profile = await VendorProfile.findOne({ where: { user_id: req.userId } });

    if (!profile) {
      return errorResponse(res, 404, 'Service profile not found');
    }

    await profile.update(req.body);
    return successResponse(res, 200, 'Profile updated', { profile });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update profile', error.message);
  }
};

// ──────────────────────────────────────────────
// GET /api/service/dashboard
// Service provider dashboard stats
// ──────────────────────────────────────────────
export const getServiceDashboard = async (req, res) => {
  try {
    const profile = await VendorProfile.findOne({ where: { user_id: req.userId } });
    if (!profile) return errorResponse(res, 404, 'Service profile not found');

    const vendorId = profile.vendor_id;
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Booking counts by status
    const bookingCounts = await Booking.findAll({
      where: { vendor_id: vendorId },
      attributes: [
        'status',
        [Booking.sequelize.fn('COUNT', Booking.sequelize.col('booking_id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    // Today's bookings
    const todayBookings = await Booking.findAll({
      where: {
        vendor_id: vendorId,
        slot_date: startOfToday.toISOString().split('T')[0],
        status: { [Op.in]: ['confirmed', 'in_progress'] },
      },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['full_name', 'phone_number'],
        },
      ],
      order: [['slot_time', 'ASC']],
    });

    // Upcoming bookings (next 7 days)
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);

    const upcomingBookings = await Booking.findAll({
      where: {
        vendor_id: vendorId,
        slot_date: { [Op.between]: [new Date(), next7Days] },
        status: 'confirmed',
      },
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['full_name', 'phone_number'],
        },
      ],
      order: [['slot_date', 'ASC'], ['slot_time', 'ASC']],
      limit: 10,
    });

    // Earnings this month (completed bookings)
    const monthlyEarnings = await Booking.findAll({
      where: {
        vendor_id: vendorId,
        status: 'completed',
        created_at: { [Op.gte]: startOfMonth },
      },
      attributes: [
        [Booking.sequelize.fn('SUM', Booking.sequelize.col('total_amount')), 'total'],
        [Booking.sequelize.fn('COUNT', Booking.sequelize.col('booking_id')), 'count'],
      ],
      raw: true,
    });

    // Pending approval count
    const pendingCount = await Booking.count({
      where: { vendor_id: vendorId, status: 'pending' },
    });

    // Active services/listings count
    const activeListings = await Listing.count({
      where: { vendor_id: vendorId, is_active: true },
    });

    return successResponse(res, 200, 'Dashboard data retrieved', {
      overview: {
        pending_approvals: pendingCount,
        active_services: activeListings,
        today_bookings: todayBookings.length,
        monthly_earnings: parseFloat(monthlyEarnings[0]?.total || 0),
        monthly_completed: parseInt(monthlyEarnings[0]?.count || 0),
      },
      bookings_by_status: bookingCounts,
      todays_schedule: todayBookings,
      upcoming_bookings: upcomingBookings,
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to get dashboard', error.message);
  }
};
