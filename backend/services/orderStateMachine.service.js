// services/orderStateMachine.service.js
// Manages order status transitions with validation

import { ORDER_CONFIG } from '../config/orderConfig.js';
import OrderHistory from '../models/orderHistory.js';

class OrderStateMachine {
  /**
   * Check if a status transition is valid
   */
  isValidTransition(currentStatus, newStatus) {
    const allowedStatuses = ORDER_CONFIG.STATUS_FLOW[currentStatus] || [];
    return allowedStatuses.includes(newStatus);
  }

  /**
   * Check if a user role can perform this transition
   */
  canRoleTransition(role, currentStatus, newStatus) {
    const rolePermissions = ORDER_CONFIG.ROLE_PERMISSIONS[role];
    
    if (!rolePermissions) {
      return false;
    }

    // Admin can do anything
    if (rolePermissions.allowed_transitions['*'] === true) {
      return this.isValidTransition(currentStatus, newStatus);
    }

    const allowedForStatus = rolePermissions.allowed_transitions[currentStatus] || [];
    return allowedForStatus.includes(newStatus);
  }

  /**
   * Transition order to new status with validation
   */
  async transitionStatus(order, newStatus, { userId, userRole, comment, metadata = {} }) {
    const currentStatus = order.status;

    // 1. Check if transition is valid in state machine
    if (!this.isValidTransition(currentStatus, newStatus)) {
      throw new Error(
        `Invalid status transition: ${currentStatus} → ${newStatus}. ` +
        `Allowed: ${ORDER_CONFIG.STATUS_FLOW[currentStatus].join(', ')}`
      );
    }

    // 2. Check if user role has permission
    if (!this.canRoleTransition(userRole, currentStatus, newStatus)) {
      throw new Error(
        `Role '${userRole}' cannot transition from ${currentStatus} to ${newStatus}`
      );
    }

    // 3. Additional validations for specific transitions
    await this.validateTransitionRules(order, currentStatus, newStatus, { userId, userRole });

    // 4. Update order status
    order.status = newStatus;

    // 5. Update relevant timestamps
    const now = new Date();
    switch (newStatus) {
      case 'confirmed':
        order.confirmed_at = now;
        break;
      case 'shipped':
        order.shipped_at = now;
        break;
      case 'delivered':
        order.delivered_at = now;
        order.actual_delivery_date = now;
        break;
      case 'cancelled':
        order.cancelled_at = now;
        break;
    }

    await order.save();

    // 6. Log to order history
    await this.logStatusChange(order.order_id, currentStatus, newStatus, {
      userId,
      userRole,
      comment,
      metadata,
    });

    console.log(
      `[ORDER STATE] Order ${order.order_id}: ${currentStatus} → ${newStatus} (by ${userRole})`
    );

    return order;
  }

  /**
   * Additional validation rules for specific transitions
   */
  async validateTransitionRules(order, currentStatus, newStatus, { userId, userRole }) {
    // Cancellation window check for customers
    if (newStatus === 'cancelled' && userRole === 'customer') {
      const orderAge = Date.now() - new Date(order.created_at).getTime();
      const maxAge = ORDER_CONFIG.CANCELLATION_WINDOW_HOURS * 60 * 60 * 1000;
      
      if (orderAge > maxAge) {
        throw new Error(
          `Order can only be cancelled within ${ORDER_CONFIG.CANCELLATION_WINDOW_HOURS} hours of placement`
        );
      }

      // Customer can only cancel if order is still pending
      if (currentStatus !== 'pending') {
        throw new Error('Customer can only cancel pending orders');
      }
    }

    // Can't mark as shipped without tracking info (optional, can remove if too strict)
    // if (newStatus === 'shipped' && !order.tracking_number) {
    //   throw new Error('Tracking number required to mark order as shipped');
    // }

    // Add more rules as needed
  }

  /**
   * Log status change to order_history table
   */
  async logStatusChange(orderId, oldStatus, newStatus, { userId, userRole, comment, metadata }) {
    await OrderHistory.create({
      order_id: orderId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: userId || null,
      changed_by_role: userRole,
      comment: comment || null,
      metadata: metadata || {},
    });
  }

  /**
   * Get order history for an order
   */
  async getOrderHistory(orderId) {
    return await OrderHistory.findAll({
      where: { order_id: orderId },
      order: [['created_at', 'ASC']],
    });
  }

  /**
   * Get available next statuses for an order based on user role
   */
  getAvailableTransitions(order, userRole) {
    const currentStatus = order.status;
    const allPossible = ORDER_CONFIG.STATUS_FLOW[currentStatus] || [];
    
    // Filter by role permissions
    return allPossible.filter(status => 
      this.canRoleTransition(userRole, currentStatus, status)
    );
  }
}

export default new OrderStateMachine();