import apiClient from './client';

// USERS ✅ (already perfect)
export const getAllUsers = (params = {}) => apiClient.get('/api/admin/users', { params });
export const updateUserStatus = (id, is_active) =>
  apiClient.put(`/api/admin/users/${id}/status`, { is_active });
export const changeUserRole = (id, role) =>
  apiClient.put(`/api/admin/users/${id}/role`, { role });
export const deleteUser = (id) =>
  apiClient.delete(`/api/admin/users/${id}`);

// VENDORS ✅ (add params support)
export const getAllVendors = (params = {}) => apiClient.get('/api/admin/vendors', { params });
export const updateVendorStatus = (id, is_active, reason) =>
  apiClient.put(`/api/admin/vendors/${id}/status`, { is_active, reason });

// LISTINGS ✅ (add params support)
export const getAllListingsAdmin = (params = {}) =>
  apiClient.get('/api/admin/listings', { params });

// ORDERS ✅ (add params support)
export const getAllOrdersAdmin = (params = {}) =>
  apiClient.get('/api/admin/orders', { params });

export const updateDisputeStatus = (id, data) =>
  apiClient.put(`/api/admin/orders/${id}/dispute`, data);

// ANALYTICS ✅ (already perfect)
export const getAnalytics = () =>
  apiClient.get('/api/admin/analytics');