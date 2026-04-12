// controllers/serviceAvailability.controller.js
import { ServiceAvailability, VendorProfile } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/responseBuilder.js';

// ──────────────────────────────────────────────
// GET /api/service/availability
// Provider: Get own availability schedule
// ──────────────────────────────────────────────
export const getAvailability = async (req, res) => {
  try {
    const profile = await VendorProfile.findOne({ where: { user_id: req.userId } });
    if (!profile) return errorResponse(res, 404, 'Service profile not found');

    const availability = await ServiceAvailability.findAll({
      where: { vendor_id: profile.vendor_id },
      order: [['day_of_week', 'ASC'], ['specific_date', 'ASC']],
    });

    return successResponse(res, 200, 'Availability retrieved', { availability });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to get availability', error.message);
  }
};

// ──────────────────────────────────────────────
// POST /api/service/availability
// Provider: Set availability for a day/date
// ──────────────────────────────────────────────
export const setAvailability = async (req, res) => {
  try {
    const profile = await VendorProfile.findOne({ where: { user_id: req.userId } });
    if (!profile) return errorResponse(res, 404, 'Service profile not found');

    const { day_of_week, specific_date, start_time, end_time, slot_duration_mins, is_available } = req.body;

    if (!start_time || !end_time) {
      return errorResponse(res, 400, 'start_time and end_time are required');
    }
    if (day_of_week === undefined && !specific_date) {
      return errorResponse(res, 400, 'Either day_of_week or specific_date is required');
    }

    const [slot, created] = await ServiceAvailability.upsert({
      vendor_id: profile.vendor_id,
      day_of_week: day_of_week ?? null,
      specific_date: specific_date ?? null,
      start_time,
      end_time,
      slot_duration_mins: slot_duration_mins || 60,
      is_available: is_available ?? true,
    }, { returning: true });

    return successResponse(res, created ? 201 : 200, 'Availability saved', { slot });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to set availability', error.message);
  }
};

// ──────────────────────────────────────────────
// DELETE /api/service/availability/:availabilityId
// Provider: Remove an availability slot
// ──────────────────────────────────────────────
export const deleteAvailability = async (req, res) => {
  try {
    const profile = await VendorProfile.findOne({ where: { user_id: req.userId } });
    if (!profile) return errorResponse(res, 404, 'Service profile not found');

    const slot = await ServiceAvailability.findOne({
      where: { availability_id: req.params.availabilityId, vendor_id: profile.vendor_id },
    });

    if (!slot) return errorResponse(res, 404, 'Availability slot not found');

    await slot.destroy();
    return successResponse(res, 200, 'Availability slot removed');
  } catch (error) {
    return errorResponse(res, 500, 'Failed to delete slot', error.message);
  }
};

// ──────────────────────────────────────────────
// GET /api/catalog/service/:vendorId/availability
// PUBLIC: Customer views provider's available slots for a date
// ──────────────────────────────────────────────
export const getPublicAvailability = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { date } = req.query; // e.g. ?date=2026-04-10

    const vendor = await VendorProfile.findOne({
      where: { vendor_id: vendorId, is_active: true },
    });
    if (!vendor) return errorResponse(res, 404, 'Service provider not found');

    const dayOfWeek = date ? new Date(date).getDay() : null;

    const slots = await ServiceAvailability.findAll({
      where: {
        vendor_id: vendorId,
        is_available: true,
        ...(dayOfWeek !== null && { day_of_week: dayOfWeek }),
      },
      order: [['start_time', 'ASC']],
    });

    return successResponse(res, 200, 'Available slots retrieved', {
      vendor_id: vendorId,
      date: date || null,
      slots,
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to get availability', error.message);
  }
};
