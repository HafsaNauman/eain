import apiClient from './authService';

// USERS ✅ (already perfect)
export const getAllUsers = (params = {}) => apiClient.get('/admin/users', { params });
export const updateUserStatus = (id, is_active) =>
  apiClient.put(`/admin/users/${id}/status`, { is_active });
export const changeUserRole = (id, role) =>
  apiClient.put(`/admin/users/${id}/role`, { role });
export const deleteUser = (id) =>
  apiClient.delete(`/admin/users/${id}`);

// VENDORS ✅ (add params support)
export const getAllVendors = (params = {}) => apiClient.get('/admin/vendors', { params });
export const updateVendorStatus = (id, is_active, reason) =>
  apiClient.put(`/admin/vendors/${id}/status`, { is_active, reason });

// LISTINGS ✅ (add params support)
export const getAllListingsAdmin = (params = {}) =>
  apiClient.get('/admin/listings', { params });

// ORDERS ✅ (add params support)
export const getAllOrdersAdmin = (params = {}) =>
  apiClient.get('/admin/orders', { params });

export const updateDisputeStatus = (id, data) =>
  apiClient.put(`/admin/orders/${id}/dispute`, data);

// ANALYTICS ✅ (already perfect)
export const getAnalytics = () =>
  apiClient.get('/admin/analytics');