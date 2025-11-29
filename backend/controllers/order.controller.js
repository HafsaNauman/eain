
import { Order, Listing, VendorProfile, User } from '../models/index.js';
import { successResponse, errorResponse } from '../utils/responseBuilder.js';

/**
 * POST /api/orders
 * Customer: Place a new order (single product)
 * Body: { listing_id, quantity, payment_method, shipping_address, city, area, customer_phone }
 */
export const placeOrder = async (req, res) => {
    try {
        const customer_id = req.userId; // From JWT middleware
        const {
            listing_id,
            quantity,
            payment_method,
            shipping_address,
            city,
            area,
            customer_phone,
            notes,
        } = req.body;

        // Validate required fields
        if (!listing_id || !quantity || !payment_method || !shipping_address || !city || !customer_phone) {
            return errorResponse(
                res,
                400,
                'Missing required fields: listing_id, quantity, payment_method, shipping_address, city, customer_phone'
            );
        }

        // Validate payment method
        const validMethods = ['cod', 'bank_transfer'];
        if (!validMethods.includes(payment_method)) {
            return errorResponse(
                res,
                400,
                `Invalid payment method. Must be one of: ${validMethods.join(', ')}`
            );
        }

        // Validate quantity
        if (quantity < 1) {
            return errorResponse(res, 400, 'Quantity must be at least 1');
        }

        // 1. Find listing (must be active and belong to an active vendor)
        const listing = await Listing.findByPk(listing_id, {
            include: [
                {
                    association: 'Vendor',
                    model: VendorProfile,
                    attributes: ['vendor_id', 'user_id', 'business_name_en', 'city', 'is_active'],
                    required: true,
                },
            ],
        });

        if (!listing) {
            return errorResponse(res, 404, 'Listing not found');
        }

        // 2. Check if listing is active
        if (!listing.is_active) {
            return errorResponse(res, 400, 'This listing is no longer available');
        }

        // 3. Check if vendor is active
        if (!listing.Vendor || !listing.Vendor.is_active) {
            return errorResponse(res, 400, 'Vendor shop is inactive. Cannot place order');
        }

        // 4. Check if listing has a price (price on request not allowed for orders)
        if (!listing.price) {
            return errorResponse(res, 400, 'This listing has no fixed price. Please contact vendor directly');
        }

        // 5. Calculate total amount
        const price_per_item = listing.price;
        const total_amount = price_per_item * quantity;

        // 6. Create order
        const order = await Order.create({
            customer_id,
            vendor_id: listing.Vendor.vendor_id,
            listing_id,
            quantity,
            price_per_item,
            total_amount,
            currency: listing.currency,
            payment_method,
            payment_status: 'pending',
            status: 'pending',
            shipping_address,
            city,
            area: area || null,
            customer_phone,
            notes: notes || null,
        });

        // 7. Return order details
        const orderWithDetails = await Order.findByPk(order.order_id, {
            include: [
                {
                    association: 'customer',
                    model: User,
                    attributes: ['user_id', 'full_name', 'phone_number', 'email'],
                },
                {
                    association: 'listing',
                    model: Listing,
                    attributes: ['listing_id', 'title_en', 'title_ur', 'price', 'currency'],
                },
                {
                    association: 'vendor',
                    model: VendorProfile,
                    attributes: ['vendor_id', 'business_name_en', 'business_name_ur', 'city', 'area'],
                },
            ],
        });

        return successResponse(res, 201, 'Order placed successfully', { order: orderWithDetails });
    } catch (error) {
        console.error('Place Order Error:', error);
        return errorResponse(res, 500, 'Failed to place order', error.message);
    }
};

/**
 * GET /api/orders/my
 * Customer: Get all orders for logged-in customer
 */
export const getMyOrders = async (req, res) => {
    try {
        const customer_id = req.userId;

        const orders = await Order.findAll({
            where: { customer_id },
            include: [
                {
                    association: 'listing',
                    model: Listing,
                    attributes: ['listing_id', 'title_en', 'title_ur', 'price', 'currency', 'media'],
                },
                {
                    association: 'vendor',
                    model: VendorProfile,
                    attributes: ['vendor_id', 'business_name_en', 'city', 'area'],
                },
            ],
            order: [['created_at', 'DESC']],
        });

        return successResponse(res, 200, 'Orders retrieved successfully', { orders });
    } catch (error) {
        console.error('Get My Orders Error:', error);
        return errorResponse(res, 500, 'Failed to retrieve orders', error.message);
    }
};

/**
 * GET /api/vendor/orders
 * Vendor: Get all orders for their vendor profile
 */
export const getVendorOrders = async (req, res) => {
    try {
        const vendor_id_param = req.params.vendor_id; // From URL if needed
        const userId = req.userId; // From JWT

        // Step 1: Get vendor profile for this user
        const vendorProfile = await VendorProfile.findOne({
            where: { user_id: userId },
        });

        if (!vendorProfile) {
            return errorResponse(res, 404, 'Vendor profile not found');
        }

        // Step 2: Get all orders for this vendor
        const orders = await Order.findAll({
            where: { vendor_id: vendorProfile.vendor_id },
            include: [
                {
                    association: 'customer',
                    model: User,
                    attributes: ['user_id', 'full_name', 'phone_number', 'email'],
                },
                {
                    association: 'listing',
                    model: Listing,
                    attributes: ['listing_id', 'title_en', 'title_ur', 'price', 'currency'],
                },
            ],
            order: [['created_at', 'DESC']],
        });

        return successResponse(res, 200, 'Vendor orders retrieved successfully', { orders });
    } catch (error) {
        console.error('Get Vendor Orders Error:', error);
        return errorResponse(res, 500, 'Failed to retrieve vendor orders', error.message);
    }
};

/**
 * PUT /api/vendor/orders/:order_id/status
 * Vendor: Update order status (confirm or cancel)
 * Body: { status: 'confirmed' | 'cancelled' }
 */
export const updateOrderStatus = async (req, res) => {
    try {
        const userId = req.userId;
        const order_id = req.params.order_id;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['confirmed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return errorResponse(
                res,
                400,
                `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            );
        }

        // Step 1: Get vendor profile for this user
        const vendorProfile = await VendorProfile.findOne({
            where: { user_id: userId },
        });

        if (!vendorProfile) {
            return errorResponse(res, 404, 'Vendor profile not found');
        }

        // Step 2: Find order and verify it belongs to this vendor
        const order = await Order.findByPk(order_id);

        if (!order) {
            return errorResponse(res, 404, 'Order not found');
        }

        if (order.vendor_id !== vendorProfile.vendor_id) {
            return errorResponse(res, 403, 'You do not have permission to update this order');
        }

        // Step 3: Update order status
        order.status = status;
        await order.save();

        // Step 4: Return updated order
        const updatedOrder = await Order.findByPk(order_id, {
            include: [
                {
                    association: 'customer',
                    model: User,
                    attributes: ['user_id', 'full_name', 'phone_number'],
                },
                {
                    association: 'listing',
                    model: Listing,
                    attributes: ['listing_id', 'title_en', 'title_ur'],
                },
            ],
        });

        return successResponse(
            res,
            200,
            `Order ${status} successfully`,
            { order: updatedOrder }
        );
    } catch (error) {
        console.error('Update Order Status Error:', error);
        return errorResponse(res, 500, 'Failed to update order status', error.message);
    }
};