// services/payout.service.js
// Handles vendor payout calculation and processing
// Currently DORMANT - activate when commission/payment integration is ready

import Payout from '../models/payout.js';
import { ORDER_CONFIG } from '../config/orderConfig.js';

class PayoutService {
  /**
   * Create payout record when order is delivered
   * Currently dormant - just creates record with 0% commission
   */
  async createPayoutRecord(order) {
    if (!ORDER_CONFIG.PAYOUT.enabled) {
      console.log(`[PAYOUT] Payout system dormant - skipping payout creation for order ${order.order_id}`);
      return null;
    }

    // Check if payout already exists
    const existingPayout = await Payout.findOne({ where: { order_id: order.order_id } });
    if (existingPayout) {
      return existingPayout;
    }

    // Get commission rate (currently 0%)
    const commissionRate = ORDER_CONFIG.COMMISSION.enabled 
      ? ORDER_CONFIG.COMMISSION.default_rate 
      : 0;

    // Calculate payout
    const orderTotal = parseFloat(order.total_amount);
    const commissionDeducted = (orderTotal * commissionRate) / 100;
    const deliveryFee = parseFloat(order.delivery_fee || 0);
    const netPayable = orderTotal - commissionDeducted - deliveryFee;

    // Calculate hold period
    const holdUntilDate = new Date();
    holdUntilDate.setDate(holdUntilDate.getDate() + ORDER_CONFIG.PAYOUT.hold_period_days);

    // Create payout record
    const payout = await Payout.create({
      order_id: order.order_id,
      vendor_id: order.vendor_id,
      order_total: orderTotal,
      commission_deducted: commissionDeducted,
      delivery_fee: deliveryFee,
      net_payable: netPayable,
      currency: order.currency,
      status: 'hold', // Start in hold period
      order_delivered_at: order.delivered_at,
      hold_until: holdUntilDate,
    });

    console.log(
      `[PAYOUT] Created payout ${payout.payout_id} for order ${order.order_id} - ` +
      `Vendor gets ${netPayable} ${order.currency} (Hold until: ${holdUntilDate.toISOString()})`
    );

    return payout;
  }

  /**
   * Check for payouts ready to process (hold period expired)
   * Run this as a cron job daily
   */
  async processReadyPayouts() {
    if (!ORDER_CONFIG.PAYOUT.enabled) {
      console.log('[PAYOUT] Payout system dormant - skipping ready payouts check');
      return { processed: 0, message: 'Payout system inactive' };
    }

    const now = new Date();

    // Find payouts in 'hold' status where hold period has expired
    const readyPayouts = await Payout.findAll({
      where: {
        status: 'hold',
        hold_until: { [Op.lte]: now },
      },
    });

    console.log(`[PAYOUT] Found ${readyPayouts.length} payouts ready for processing`);

    // Update status to ready_for_payout
    for (const payout of readyPayouts) {
      payout.status = 'ready_for_payout';
      await payout.save();
    }

    return {
      processed: readyPayouts.length,
      ready_for_payout: readyPayouts.map(p => ({
        payout_id: p.payout_id,
        order_id: p.order_id,
        vendor_id: p.vendor_id,
        net_payable: p.net_payable,
      })),
    };
  }

  /**
   * Generate CSV for JazzCash/EasyPaisa bulk payout
   * Format: vendor_phone, amount, reference
   */
  async generatePayoutCSV(payoutIds) {
    if (!ORDER_CONFIG.PAYOUT.enabled) {
      throw new Error('Payout system is not enabled yet');
    }

    // This will be implemented when payment integration is ready
    // For now, just a placeholder
    console.log('[PAYOUT] CSV generation - Feature coming soon');
    return null;
  }

  /**
   * Get vendor's pending payouts
   */
  async getVendorPayouts(vendorId) {
    return await Payout.findAll({
      where: { vendor_id: vendorId },
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Get payout summary for vendor
   */
  async getVendorPayoutSummary(vendorId) {
    const payouts = await Payout.findAll({
      where: { vendor_id: vendorId },
    });

    const summary = {
      total_orders: payouts.length,
      pending: { count: 0, amount: 0 },
      hold: { count: 0, amount: 0 },
      ready_for_payout: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
    };

    payouts.forEach(payout => {
      const status = payout.status;
      if (summary[status]) {
        summary[status].count++;
        summary[status].amount += parseFloat(payout.net_payable);
      }
    });

    return summary;
  }

  /**
   * Admin: Get all ready payouts
   */
  async getAllReadyPayouts() {
    return await Payout.findAll({
      where: { status: 'ready_for_payout' },
      order: [['hold_until', 'ASC']],
    });
  }
}

export default new PayoutService();