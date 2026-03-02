// controllers/order.controller.js - COMPLETE REWRITE
// Enhanced with inventory, state machine, and audit logging

import OrderService from '../services/order.service.js';
import InventoryService from '../services/inventory.service.js';
import { successResponse, errorResponse } from '../utils/responseBuilder.js';

/**
 * POST /api/orders - Place new order (Customer)
 */
export const placeOrder = async (req, res) => {
  try {
    const customerId = req.userId; // From JWT middleware
    const orderData = req.body;

    // Validate required fields
    const required = ['listing_id', 'quantity', 'payment_method', 'shipping_address', 'city', 'customer_phone'];
    for (const field of required) {
      if (!orderData[field]) {
        return errorResponse(res, 400, `Missing required field: ${field}`);
      }
    }

    // Validate payment method
    if (!['cod', 'bank_transfer'].includes(orderData.payment_method)) {
      return errorResponse(res, 400, 'Invalid payment method. Must be cod or bank_transfer');
    }

    // Validate quantity
    if (orderData.quantity < 1) {
      return errorResponse(res, 400, 'Quantity must be at least 1');
    }

    // Place order using service
    const order = await OrderService.placeOrder(orderData, customerId);

    // Fetch order with full details
    const orderWithDetails = await OrderService.getOrderDetails(order.order_id);

    return successResponse(res, 201, 'Order placed successfully', {
      order: orderWithDetails,
    });
  } catch (error) {
    console.error('[PLACE ORDER ERROR]', error);
    return errorResponse(res, 500, 'Failed to place order', error.message);
  }
};

/**
 * GET /api/orders/my - Get customer's orders
 */
export const getMyOrders = async (req, res) => {
  try {
    const customerId = req.userId;

    const orders = await OrderService.getCustomerOrders(customerId);

    return successResponse(res, 200, 'Orders retrieved successfully', {
      orders,
      total: orders.length,
    });
  } catch (error) {
    console.error('[GET MY ORDERS ERROR]', error);
    return errorResponse(res, 500, 'Failed to retrieve orders', error.message);
  }
};

/**
 * GET /api/orders/:order_id - Get single order details
 */
export const getOrderDetails = async (req, res) => {
  try {
    const { order_id } = req.params;
    const userId = req.userId;
    const userRole = req.userRole; // From JWT

    const order = await OrderService.getOrderDetails(order_id);

    if (!order) {
      return errorResponse(res, 404, 'Order not found');
    }

    // Authorization check
    const isCustomer = order.customer_id === userId;
    const isVendor = order.vendor?.user_id === userId;
    const isAdmin = userRole === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return errorResponse(res, 403, 'You do not have permission to view this order');
    }

    return successResponse(res, 200, 'Order details retrieved', { order });
  } catch (error) {
    console.error('[GET ORDER DETAILS ERROR]', error);
    return errorResponse(res, 500, 'Failed to retrieve order details', error.message);
  }
};

/**
 * GET /api/orders/:order_id/history - Get order history/audit trail
 */
export const getOrderHistory = async (req, res) => {
  try {
    const { order_id } = req.params;
    
    const history = await OrderService.getOrderHistory(order_id);

    return successResponse(res, 200, 'Order history retrieved', {
      order_id: parseInt(order_id),
      history,
    });
  } catch (error) {
    console.error('[GET ORDER HISTORY ERROR]', error);
    return errorResponse(res, 500, 'Failed to retrieve order history', error.message);
  }
};

/**
 * GET /api/orders/:order_id/available-actions - Get available status transitions
 */
export const getAvailableActions = async (req, res) => {
  try {
    const { order_id } = req.params;
    const userRole = req.userRole || 'customer';

    const actions = await OrderService.getAvailableActions(order_id, userRole);

    return successResponse(res, 200, 'Available actions retrieved', {
      order_id: parseInt(order_id),
      current_role: userRole,
      available_actions: actions,
    });
  } catch (error) {
    console.error('[GET AVAILABLE ACTIONS ERROR]', error);
    return errorResponse(res, 500, 'Failed to retrieve available actions', error.message);
  }
};

/**
 * PUT /api/orders/:order_id/status - Update order status (Vendor/Admin)
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status, comment, tracking_number, courier_name, estimated_delivery_date } = req.body;
    const userId = req.userId;
    const userRole = req.userRole || 'vendor';

    if (!status) {
      return errorResponse(res, 400, 'Status is required');
    }

    // Build metadata
    const metadata = {};
    if (tracking_number) metadata.tracking_number = tracking_number;
    if (courier_name) metadata.courier_name = courier_name;
    if (estimated_delivery_date) metadata.estimated_delivery_date = estimated_delivery_date;

    // Update tracking fields if provided
    if (tracking_number || courier_name || estimated_delivery_date) {
      const order = await OrderService.getOrderDetails(order_id);
      if (tracking_number) order.tracking_number = tracking_number;
      if (courier_name) order.courier_name = courier_name;
      if (estimated_delivery_date) order.estimated_delivery_date = estimated_delivery_date;
      await order.save();
    }

    // Update status using service
    const updatedOrder = await OrderService.updateOrderStatus(order_id, status, {
      userId,
      userRole,
      comment: comment || null,
      metadata,
    });

    const orderWithDetails = await OrderService.getOrderDetails(updatedOrder.order_id);

    return successResponse(res, 200, 'Order status updated successfully', {
      order: orderWithDetails,
    });
  } catch (error) {
    console.error('[UPDATE ORDER STATUS ERROR]', error);
    return errorResponse(res, 500, 'Failed to update order status', error.message);
  }
};

/**
 * POST /api/orders/:order_id/cancel - Cancel order (Customer/Vendor/Admin)
 */
export const cancelOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { reason } = req.body;
    const userId = req.userId;
    const userRole = req.userRole || 'customer';

    const order = await OrderService.getOrderDetails(order_id);

    if (!order) {
      return errorResponse(res, 404, 'Order not found');
    }

    // Authorization check
    const isCustomer = order.customer_id === userId;
    const isVendor = order.vendor?.user_id === userId;
    const isAdmin = userRole === 'admin';

    if (!isCustomer && !isVendor && !isAdmin) {
      return errorResponse(res, 403, 'You do not have permission to cancel this order');
    }

    // Cancel using service (handles state machine validation)
    const cancelledOrder = await OrderService.cancelOrder(order_id, {
      userId,
      userRole,
      reason: reason || 'No reason provided',
    });

    // Update cancelled_by field
    cancelledOrder.cancelled_by = userRole === 'customer' ? 'customer' : 'vendor';
    cancelledOrder.cancellation_reason = reason || null;
    await cancelledOrder.save();

    const orderWithDetails = await OrderService.getOrderDetails(cancelledOrder.order_id);

    return successResponse(res, 200, 'Order cancelled successfully', {
      order: orderWithDetails,
    });
  } catch (error) {
    console.error('[CANCEL ORDER ERROR]', error);
    return errorResponse(res, 500, 'Failed to cancel order', error.message);
  }
};

/**
 * GET /api/vendor/orders - Get all orders for vendor
 */
export const getVendorOrders = async (req, res) => {
  try {
    const userId = req.userId;

    // Get vendor profile first
    const { VendorProfile } = await import('../models/index.js');
    const vendorProfile = await VendorProfile.findOne({ where: { user_id: userId } });

    if (!vendorProfile) {
      return errorResponse(res, 404, 'Vendor profile not found');
    }

    const orders = await OrderService.getVendorOrders(vendorProfile.vendor_id);

    return successResponse(res, 200, 'Vendor orders retrieved successfully', {
      orders,
      total: orders.length,
    });
  } catch (error) {
    console.error('[GET VENDOR ORDERS ERROR]', error);
    return errorResponse(res, 500, 'Failed to retrieve vendor orders', error.message);
  }
};

/**
 * GET /api/vendor/orders/stats - Get vendor order statistics
 */
export const getVendorOrderStats = async (req, res) => {
  try {
    const userId = req.userId;

    const { VendorProfile } = await import('../models/index.js');
    const vendorProfile = await VendorProfile.findOne({ where: { user_id: userId } });

    if (!vendorProfile) {
      return errorResponse(res, 404, 'Vendor profile not found');
    }

    const orders = await OrderService.getVendorOrders(vendorProfile.vendor_id);

    // Calculate stats
    const stats = {
      total_orders: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      total_revenue: orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
    };

    return successResponse(res, 200, 'Vendor order statistics', { stats });
  } catch (error) {
    console.error('[GET VENDOR ORDER STATS ERROR]', error);
    return errorResponse(res, 500, 'Failed to retrieve statistics', error.message);
  }
};

/**
 * GET /api/vendor/inventory/low-stock - Get low stock listings
 */
export const getLowStockListings = async (req, res) => {
  try {
    const userId = req.userId;

    const { VendorProfile } = await import('../models/index.js');
    const vendorProfile = await VendorProfile.findOne({ where: { user_id: userId } });

    if (!vendorProfile) {
      return errorResponse(res, 404, 'Vendor profile not found');
    }

    const lowStockListings = await InventoryService.getLowStockListings(vendorProfile.vendor_id);

    return successResponse(res, 200, 'Low stock listings retrieved', {
      low_stock_listings: lowStockListings,
      count: lowStockListings.length,
    });
  } catch (error) {
    console.error('[GET LOW STOCK ERROR]', error);
    return errorResponse(res, 500, 'Failed to retrieve low stock listings', error.message);
  }
};