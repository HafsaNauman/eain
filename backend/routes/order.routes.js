
// import express from 'express';
// import {
//     placeOrder,
//     getMyOrders,
//     getVendorOrders,
//     updateOrderStatus,
// } from '../controllers/order.controller.js';
// import { verifyJWT } from '../middlewares/authJwt.js';

// const router = express.Router();

// // ===== CUSTOMER ROUTES (Protected - require JWT) =====

// // POST /api/orders - Place a new order
// router.post('/', verifyJWT, placeOrder);

// // GET /api/orders/my - Get all orders for logged-in customer
// router.get('/my', verifyJWT, getMyOrders);

// // ===== VENDOR ROUTES (Protected - require JWT) =====

// // GET /api/vendor/orders - Get all orders for vendor's profile
// router.get('/vendor/orders', verifyJWT, getVendorOrders);

// // PUT /api/vendor/orders/:order_id/status - Update order status (confirm/cancel)
// router.put('/vendor/orders/:order_id/status', verifyJWT, updateOrderStatus);

// export default router;


// routes/order.routes.js - UPDATED
// Enhanced routes for complete order processing

import express from 'express';
import {
  placeOrder,
  getMyOrders,
  getOrderDetails,
  getOrderHistory,
  getAvailableActions,
  updateOrderStatus,
  cancelOrder,
  getVendorOrders,
  getVendorOrderStats,
  getLowStockListings,
} from '../controllers/order.controller.js';
// import { verifyToken } from '../middlewares/authJwt.js';
import { verifyToken } from '../services/token.service.js';


const router = express.Router();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CUSTOMER ROUTES (Protected)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * POST /api/orders
 * Place new order
 * Auth: Customer
 * Body: { listing_id, quantity, payment_method, shipping_address, city, customer_phone }
 */
router.post('/', [verifyToken], placeOrder);

/**
 * GET /api/orders/my
 * Get all orders for logged-in customer
 * Auth: Customer
 */
router.get('/my', [verifyToken], getMyOrders);

/**
 * GET /api/orders/:order_id
 * Get single order details
 * Auth: Customer/Vendor/Admin (ownership validated in controller)
 */
router.get('/:order_id', [verifyToken], getOrderDetails);

/**
 * GET /api/orders/:order_id/history
 * Get order status change history (audit trail)
 * Auth: Customer/Vendor/Admin
 */
router.get('/:order_id/history', [verifyToken], getOrderHistory);

/**
 * GET /api/orders/:order_id/available-actions
 * Get available status transitions for current user role
 * Auth: Any authenticated user
 */
router.get('/:order_id/available-actions', [verifyToken], getAvailableActions);

/**
 * POST /api/orders/:order_id/cancel
 * Cancel order (customer can cancel within 24h if pending)
 * Auth: Customer/Vendor/Admin
 * Body: { reason: string }
 */
router.post('/:order_id/cancel', [verifyToken], cancelOrder);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VENDOR ROUTES (Protected)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/vendor/orders
 * Get all orders for vendor's shop
 * Auth: Vendor
 */
router.get('/vendor/orders', [verifyToken], getVendorOrders);

/**
 * GET /api/vendor/orders/stats
 * Get order statistics (counts by status, revenue)
 * Auth: Vendor
 */
router.get('/vendor/orders/stats', [verifyToken], getVendorOrderStats);

/**
 * PUT /api/orders/:order_id/status
 * Update order status (vendor can: confirm, cancel, process, ship)
 * Auth: Vendor/Admin
 * Body: { 
 *   status: string,
 *   comment?: string,
 *   tracking_number?: string,
 *   courier_name?: string,
 *   estimated_delivery_date?: string
 * }
 */
router.put('/:order_id/status', [verifyToken], updateOrderStatus);

/**
 * GET /api/vendor/inventory/low-stock
 * Get listings with low stock alerts
 * Auth: Vendor
 */
router.get('/vendor/inventory/low-stock', [verifyToken], getLowStockListings);

export default router;