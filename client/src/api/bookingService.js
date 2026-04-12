/**
 * bookingService.js
 * Customer-side service booking API
 * API Guide §8:
 *   GET  /api/catalog/listings              → browse all listings (filter listing_type=service)
 *   GET  /api/bookings/providers/:id/availability?date=
 *   POST /api/bookings                      → create booking
 *   GET  /api/bookings/my?status=           → my bookings
 *   GET  /api/bookings/:id                  → booking detail
 *   PUT  /api/bookings/:id/cancel           → cancel booking
 */
import apiClient from './authService';

// Browse service listings — GET /api/catalog/listings?listing_type=service&...
export const getServiceListings = async (params = {}) => {
  try {
    const res = await apiClient.get('/api/catalog/listings', {
      params: { listing_type: 'service', limit: 30, offset: 0, ...params },
    });
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, error: e.response?.data?.message || 'Failed to load services' };
  }
};

// Provider availability for a date — GET /api/bookings/providers/:id/availability?date=
export const getProviderAvailability = async (vendorId, date) => {
  try {
    const res = await apiClient.get(`/api/bookings/providers/${vendorId}/availability`, {
      params: date ? { date } : {},
    });
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, error: e.response?.data?.message || 'Failed to load availability' };
  }
};

// Create booking — POST /api/bookings
export const createBooking = async (payload) => {
  try {
    const res = await apiClient.post('/api/bookings', payload);
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, error: e.response?.data?.message || 'Failed to create booking' };
  }
};

// My bookings — GET /api/bookings/my?status=
export const getMyBookings = async (params = {}) => {
  try {
    const res = await apiClient.get('/api/bookings/my', { params: { limit: 20, ...params } });
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, error: e.response?.data?.message || 'Failed to load bookings' };
  }
};

// Single booking — GET /api/bookings/:id
export const getBookingDetail = async (id) => {
  try {
    const res = await apiClient.get(`/api/bookings/${id}`);
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, error: e.response?.data?.message || 'Failed to load booking' };
  }
};

// Cancel booking — PUT /api/bookings/:id/cancel  body: { reason }
export const cancelMyBooking = async (id, reason = 'Cancelled by customer') => {
  try {
    const res = await apiClient.put(`/api/bookings/${id}/cancel`, { reason });
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, error: e.response?.data?.message || 'Failed to cancel booking' };
  }
};
