import apiClient from './client';

// USERS
export const getAllUsers = (params = {}) => apiClient.get('/api/admin/users', { params });
export const updateUserStatus = (id, is_verified) =>
  apiClient.put(`/api/admin/users/${id}/status`, { is_verified });
export const changeUserRole = (id, role) =>
  apiClient.put(`/api/admin/users/${id}/role`, { role });
export const deleteUser = (id) =>
  apiClient.delete(`/api/admin/users/${id}`);

// VENDORS
export const getAllVendors = (params = {}) => apiClient.get('/api/admin/vendors', { params });
export const updateVendorStatus = (id, is_active, reason) =>
  apiClient.put(`/api/admin/vendors/${id}/status`, { is_active, reason });
export const deleteVendor = (id) =>
  apiClient.delete(`/api/admin/vendors/${id}`);

// LISTINGS
export const getAllListingsAdmin = (params = {}) =>
  apiClient.get('/api/admin/listings', { params });

// ORDERS
export const getAllOrdersAdmin = (params = {}) =>
  apiClient.get('/api/admin/orders', { params });
export const updateDisputeStatus = (id, data) =>
  apiClient.put(`/api/admin/orders/${id}/dispute`, data);
export const deleteOrder = (id) =>
  apiClient.delete(`/api/admin/orders/${id}`);

// ANALYTICS
export const getAnalytics = () =>
  apiClient.get('/api/admin/analytics');