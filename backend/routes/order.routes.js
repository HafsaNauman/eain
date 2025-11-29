
import express from 'express';
import {
    placeOrder,
    getMyOrders,
    getVendorOrders,
    updateOrderStatus,
} from '../controllers/order.controller.js';
import { verifyJWT } from '../middlewares/authJwt.js';

const router = express.Router();

// ===== CUSTOMER ROUTES (Protected - require JWT) =====

// POST /api/orders - Place a new order
router.post('/', verifyJWT, placeOrder);

// GET /api/orders/my - Get all orders for logged-in customer
router.get('/my', verifyJWT, getMyOrders);

// ===== VENDOR ROUTES (Protected - require JWT) =====

// GET /api/vendor/orders - Get all orders for vendor's profile
router.get('/vendor/orders', verifyJWT, getVendorOrders);

// PUT /api/vendor/orders/:order_id/status - Update order status (confirm/cancel)
router.put('/vendor/orders/:order_id/status', verifyJWT, updateOrderStatus);

export default router;