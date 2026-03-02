// config/orderConfig.js
// Configuration for order processing system

export const ORDER_CONFIG = {
  // Order status flow
  STATUS_FLOW: {
    pending: ['confirmed', 'cancelled', 'failed'],
    confirmed: ['processing', 'cancelled'],
    processing: ['ready_for_pickup', 'cancelled'],
    ready_for_pickup: ['shipped', 'cancelled'],
    shipped: ['out_for_delivery', 'delivered', 'failed'],
    out_for_delivery: ['delivered', 'failed'],
    delivered: ['refunded'], // Future: allow refunds
    cancelled: [], // Terminal state
    refunded: [], // Terminal state
    failed: [], // Terminal state
  },

  // Who can change status to what
  ROLE_PERMISSIONS: {
    customer: {
      allowed_transitions: {
        pending: ['cancelled'], // Customer can cancel pending orders
      },
    },
    vendor: {
      allowed_transitions: {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['processing', 'cancelled'],
        processing: ['ready_for_pickup', 'cancelled'],
        ready_for_pickup: ['shipped', 'cancelled'],
      },
    },
    admin: {
      allowed_transitions: {
        // Admin can do any valid transition
        '*': true,
      },
    },
    system: {
      allowed_transitions: {
        shipped: ['out_for_delivery', 'delivered', 'failed'],
        out_for_delivery: ['delivered', 'failed'],
      },
    },
  },

  // Cancellation window
  CANCELLATION_WINDOW_HOURS: 24, // Customers can cancel within 24 hours

  // Delivery settings (currently dummy values)
  DELIVERY: {
    default_fee: 0, // Currently 0 - customer pays directly
    estimated_days: 3, // Default 3 days for delivery
    supported_couriers: ['TCS', 'Leopards', 'Trax', 'PostEx', 'M&P'],
  },

  // Commission settings (currently dormant)
  COMMISSION: {
    enabled: false, // NOT taking commission yet
    default_rate: 0.00, // 0% commission
    // When enabling in future, change to e.g., 10.00 for 10%
  },

  // Payout settings (currently dormant)
  PAYOUT: {
    enabled: false, // NOT processing payouts yet
    hold_period_days: 7, // 7 days hold after delivery
    // When enabling, set to true
  },

  // Inventory settings
  INVENTORY: {
    enabled: true, // Track inventory NOW
    reserve_on_order: true, // Reserve stock when order placed
    release_on_cancel: true, // Release stock when order cancelled
    deduct_on_confirm: false, // Don't deduct until confirmed (safer)
    deduct_on_shipped: true, // Deduct when shipped
  },

  // Notification triggers (for future implementation)
  NOTIFICATIONS: {
    customer: {
      order_confirmed: true,
      order_shipped: true,
      order_delivered: true,
      order_cancelled: true,
    },
    vendor: {
      new_order: true,
      order_cancelled_by_customer: true,
      low_stock_alert: true,
    },
  },
};

export default ORDER_CONFIG;