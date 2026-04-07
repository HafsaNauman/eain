/**
 * serviceService.js
 * All service-provider API calls, matched exactly to EAIN_API_Guide.md
 * Section 7 – Service Provider → /api/service/*
 * Section 9 – File Upload      → /api/upload
 */
import apiClient from './authService';

// §7 SERVICE PROFILE
export const getServiceProfile = async () => {
  try { const res = await apiClient.get('/api/service/profile'); return { success: true, data: res.data }; }
  catch (e) { return { success: false, error: e.response?.data?.message || 'Failed to fetch service profile' }; }
};

// POST /api/service/profile  (create)
// body: { business_name_en, business_name_ur, description_en, description_ur?,
//         category, city, area, is_female_only, media: { logo_url, cover_url } }
export const createServiceProfile = async (profileData) => {
  try { const res = await apiClient.post('/api/service/profile', profileData); return { success: true, data: res.data }; }
  catch (e) { return { success: false, error: e.response?.data?.message || 'Failed to create service profile' }; }
};

// PUT /api/service/profile  (update — any subset of fields)
export const updateServiceProfile = async (profileData) => {
  try { const res = await apiClient.put('/api/service/profile', profileData); return { success: true, data: res.data }; }
  catch (e) { return { success: false, error: e.response?.data?.message || 'Failed to update service profile' }; }
};

// §7 DASHBOARD
// GET /api/service/dashboard
// Response data.data: { overview: { pending_approvals, active_services, today_bookings,
//                                   monthly_earnings, monthly_completed },
//                       bookings_by_status, todays_schedule, upcoming_bookings }
export const getServiceDashboard = async () => {
  try { const res = await apiClient.get('/api/service/dashboard'); return { success: true, data: res.data }; }
  catch (e) { return { success: false, error: e.response?.data?.message || 'Failed to load dashboard' }; }
};

// §7 BOOKINGS (provider side)
// GET /api/service/bookings?status=pending  OR  ?date=2026-04-10
export const getServiceBookings = async (params = {}) => {
  try { const res = await apiClient.get('/api/service/bookings', { params }); return { success: true, data: res.data }; }
  catch (e) { return { success: false, error: e.response?.data?.message || 'Failed to load bookings' }; }
};

// PUT /api/service/bookings/:id/confirm  body: { total_amount: 5000 }
export const confirmBooking = async (bookingId, totalAmount) => {
  try { const res = await apiClient.put(`/api/service/bookings/${bookingId}/confirm`, { total_amount: totalAmount }); return { success: true, data: res.data }; }
  catch (e) { return { success: false, error: e.response?.data?.message || 'Failed to confirm booking' }; }
};

// PUT /api/service/bookings/:id/reject  body: { reason: "..." }
export const rejectBooking = async (bookingId, reason) => {
  try { const res = await apiClient.put(`/api/service/bookings/${bookingId}/reject`, { reason }); return { success: true, data: res.data }; }
  catch (e) { return { success: false, error: e.response?.data?.message || 'Failed to reject booking' }; }
};

// PUT /api/service/bookings/:id/complete  body: { payment_status: "completed" }
export const completeBooking = async (bookingId, paymentStatus = 'completed') => {
  try { const res = await apiClient.put(`/api/service/bookings/${bookingId}/complete`, { payment_status: paymentStatus }); return { success: true, data: res.data }; }
  catch (e) { return { success: false, error: e.response?.data?.message || 'Failed to complete booking' }; }
};

// PUT /api/service/bookings/:id/cancel  body: { reason }
export const cancelBookingByProvider = async (bookingId, reason) => {
  try { const res = await apiClient.put(`/api/service/bookings/${bookingId}/cancel`, { reason }); return { success: true, data: res.data }; }
  catch (e) { return { success: false, error: e.response?.data?.message || 'Failed to cancel booking' }; }
};

// §7 AVAILABILITY
// GET /api/service/availability
export const getMyAvailability = async () => {
  try { const res = await apiClient.get('/api/service/availability'); return { success: true, data: res.data }; }
  catch (e) { return { success: false, error: e.response?.data?.message || 'Failed to load availability' }; }
};

// POST /api/service/availability
// Weekly: { day_of_week, start_time, end_time, slot_duration_mins, is_available: true }
// Block:  { specific_date, start_time, end_time, is_available: false }
export const addAvailabilitySlot = async (slotData) => {
  try { const res = await apiClient.post('/api/service/availability', slotData); return { success: true, data: res.data }; }
  catch (e) { return { success: false, error: e.response?.data?.message || 'Failed to add slot' }; }
};

// DELETE /api/service/availability/:availability_id
export const removeAvailabilitySlot = async (availabilityId) => {
  try { const res = await apiClient.delete(`/api/service/availability/${availabilityId}`); return { success: true, data: res.data }; }
  catch (e) { return { success: false, error: e.response?.data?.message || 'Failed to remove slot' }; }
};

// §9 FILE UPLOAD
// POST /api/upload  multipart/form-data  body: { file }
// Response: { success: true, data: { url: "https://..." } }
export const uploadImage = async (imageUri) => {
  try {
    const formData = new FormData();
    formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'upload.jpg' });
    const res = await apiClient.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { success: true, url: res.data?.data?.url };
  } catch (e) {
    return { success: false, error: e.response?.data?.message || 'Upload failed' };
  }
};
