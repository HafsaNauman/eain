// services/order.service.js
// Main orchestrator for order processing logic

import { Order, Listing, VendorProfile, User } from '../models/index.js';
import InventoryService from './inventory.service.js';
import OrderStateMachine from './orderStateMachine.service.js';
import PayoutService from './payout.service.js';
import { ORDER_CONFIG } from '../config/orderConfig.js';

class OrderService {
  /**
   * Place a new order
   */
  async placeOrder(orderData, customerId) {
    const {
      listing_id,
      quantity,
      payment_method,
      shipping_address,
      city,
      area,
      customer_phone,
      notes,
    } = orderData;

    // 1. Fetch listing with vendor
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
      throw new Error('Listing not found');
    }

    if (!listing.is_active) {
      throw new Error('This listing is no longer available');
    }

    if (!listing.Vendor || !listing.Vendor.is_active) {
      throw new Error('Vendor shop is inactive. Cannot place order');
    }

    if (!listing.price) {
      throw new Error('This listing has no fixed price. Please contact vendor directly');
    }

    // 2. Check inventory availability
    if (ORDER_CONFIG.INVENTORY.enabled) {
      const availability = await InventoryService.checkAvailability(listing_id, quantity);
      
      if (!availability.available) {
        throw new Error(
          `Insufficient stock. Available: ${availability.available_stock}, Requested: ${quantity}`
        );
      }
    }

    // 3. Calculate amounts
    const pricePerItem = parseFloat(listing.price);
    const totalAmount = pricePerItem * quantity;

    // 4. Create order
    const order = await Order.create({
      customer_id: customerId,
      vendor_id: listing.Vendor.vendor_id,
      listing_id,
      quantity,
      price_per_item: pricePerItem,
      total_amount: totalAmount,
      currency: listing.currency,
      payment_method,
      payment_status: 'pending',
      status: 'pending',
      shipping_address,
      city,
      area: area || null,
      customer_phone,
      notes: notes || null,
      delivery_fee: ORDER_CONFIG.DELIVERY.default_fee,
    });

    // 5. Reserve stock
    if (ORDER_CONFIG.INVENTORY.enabled && ORDER_CONFIG.INVENTORY.reserve_on_order) {
      try {
        await InventoryService.reserveStock(listing_id, quantity, order.order_id);
      } catch (error) {
        // If stock reservation fails, delete the order
        await order.destroy();
        throw error;
      }
    }

    // 6. Log initial status to history
    await OrderStateMachine.logStatusChange(order.order_id, null, 'pending', {
      userId: customerId,
      userRole: 'customer',
      comment: 'Order placed',
      metadata: { listing_title: listing.title_en },
    });

    console.log(`[ORDER] New order ${order.order_id} placed by customer ${customerId}`);

    return order;
  }

  /**
   * Update order status (vendor/admin action)
   */
  async updateOrderStatus(orderId, newStatus, { userId, userRole, comment, metadata = {} }) {
    const order = await Order.findByPk(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    const previousStatus = order.status;

    // Use state machine to validate and transition
    await OrderStateMachine.transitionStatus(order, newStatus, {
      userId,
      userRole,
      comment,
      metadata,
    });

    // Handle inventory changes based on status transition
    await this.handleInventoryOnStatusChange(order, previousStatus, newStatus);

    // Handle payout creation/updates (currently dormant)
    await this.handlePayoutOnStatusChange(order, previousStatus, newStatus);

    return order;
  }

  /**
   * Handle inventory updates when order status changes
   */
  async handleInventoryOnStatusChange(order, oldStatus, newStatus) {
    if (!ORDER_CONFIG.INVENTORY.enabled) return;

    const { listing_id, quantity, order_id } = order;

    try {
      // Release stock when order is cancelled
      if (newStatus === 'cancelled' && ORDER_CONFIG.INVENTORY.release_on_cancel) {
        await InventoryService.releaseStock(listing_id, quantity, order_id);
      }

      // Deduct stock when order is shipped
      if (newStatus === 'shipped' && ORDER_CONFIG.INVENTORY.deduct_on_shipped) {
        await InventoryService.deductStock(listing_id, quantity, order_id);
      }
    } catch (error) {
      console.error(`[ORDER] Inventory update failed for order ${order_id}:`, error.message);
      // Don't fail the order status update if inventory update fails
      // Log for admin review
    }
  }

  /**
   * Handle payout creation/updates (currently dormant)
   */
  async handlePayoutOnStatusChange(order, oldStatus, newStatus) {
    if (!ORDER_CONFIG.PAYOUT.enabled) return;

    // This logic will activate when payouts are enabled
    if (newStatus === 'delivered') {
      await PayoutService.createPayoutRecord(order);
    }
  }

  /**
   * Cancel order (customer/vendor/admin)
   */
  async cancelOrder(orderId, { userId, userRole, reason }) {
    return await this.updateOrderStatus(orderId, 'cancelled', {
      userId,
      userRole,
      comment: reason || 'Order cancelled',
      metadata: { cancellation_reason: reason },
    });
  }

  /**
   * Get customer orders
   */
  async getCustomerOrders(customerId) {
    return await Order.findAll({
      where: { customer_id: customerId },
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
  }

  /**
   * Get vendor orders
   */
  async getVendorOrders(vendorId) {
    return await Order.findAll({
      where: { vendor_id: vendorId },
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
  }

  /**
   * Get single order with full details
   */
  async getOrderDetails(orderId) {
    return await Order.findByPk(orderId, {
      include: [
        {
          association: 'customer',
          model: User,
          attributes: ['user_id', 'full_name', 'phone_number', 'email'],
        },
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
    });
  }

  /**
   * Get order history/audit trail
   */
  async getOrderHistory(orderId) {
    return await OrderStateMachine.getOrderHistory(orderId);
  }

  /**
   * Get available next actions for an order based on user role
   */
  async getAvailableActions(orderId, userRole) {
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    return OrderStateMachine.getAvailableTransitions(order, userRole);
  }
}

export default new OrderService();