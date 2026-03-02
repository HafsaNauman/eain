// services/inventory.service.js
// Handles stock reservation, deduction, and release

import { Listing } from '../models/index.js';
import { Op } from 'sequelize';

class InventoryService {
  /**
   * Check if sufficient stock is available
   */
  async checkAvailability(listingId, requestedQuantity) {
    const listing = await Listing.findByPk(listingId);
    
    if (!listing) {
      throw new Error('Listing not found');
    }

    // If inventory tracking is disabled, always available
    if (!listing.track_inventory) {
      return { available: true, unlimited: true };
    }

    // If stock_quantity is NULL, unlimited stock (for services)
    if (listing.stock_quantity === null) {
      return { available: true, unlimited: true };
    }

    // Calculate available stock
    const availableStock = listing.stock_quantity - listing.reserved_quantity;

    if (availableStock < requestedQuantity) {
      return {
        available: false,
        unlimited: false,
        available_stock: availableStock,
        requested: requestedQuantity,
      };
    }

    return {
      available: true,
      unlimited: false,
      available_stock: availableStock,
    };
  }

  /**
   * Reserve stock for an order (when order is placed)
   */
  async reserveStock(listingId, quantity, orderId) {
    const listing = await Listing.findByPk(listingId);

    if (!listing) {
      throw new Error('Listing not found');
    }

    // Skip if not tracking inventory
    if (!listing.track_inventory || listing.stock_quantity === null) {
      return { reserved: false, reason: 'inventory_not_tracked' };
    }

    // Check availability
    const availability = await this.checkAvailability(listingId, quantity);
    if (!availability.available) {
      throw new Error(`Insufficient stock. Available: ${availability.available_stock}, Requested: ${quantity}`);
    }

    // Reserve the stock
    listing.reserved_quantity += quantity;
    await listing.save();

    console.log(`[INVENTORY] Reserved ${quantity} units for listing ${listingId} (Order ${orderId})`);

    return {
      reserved: true,
      listing_id: listingId,
      quantity_reserved: quantity,
      remaining_available: listing.stock_quantity - listing.reserved_quantity,
    };
  }

  /**
   * Release reserved stock (when order is cancelled)
   */
  async releaseStock(listingId, quantity, orderId) {
    const listing = await Listing.findByPk(listingId);

    if (!listing) {
      throw new Error('Listing not found');
    }

    // Skip if not tracking inventory
    if (!listing.track_inventory || listing.stock_quantity === null) {
      return { released: false, reason: 'inventory_not_tracked' };
    }

    // Release the stock
    listing.reserved_quantity = Math.max(0, listing.reserved_quantity - quantity);
    await listing.save();

    console.log(`[INVENTORY] Released ${quantity} units for listing ${listingId} (Order ${orderId})`);

    return {
      released: true,
      listing_id: listingId,
      quantity_released: quantity,
      remaining_available: listing.stock_quantity - listing.reserved_quantity,
    };
  }

  /**
   * Deduct stock (when order is shipped/completed)
   */
  async deductStock(listingId, quantity, orderId) {
    const listing = await Listing.findByPk(listingId);

    if (!listing) {
      throw new Error('Listing not found');
    }

    // Skip if not tracking inventory
    if (!listing.track_inventory || listing.stock_quantity === null) {
      return { deducted: false, reason: 'inventory_not_tracked' };
    }

    // Deduct from both stock_quantity and reserved_quantity
    listing.stock_quantity = Math.max(0, listing.stock_quantity - quantity);
    listing.reserved_quantity = Math.max(0, listing.reserved_quantity - quantity);
    await listing.save();

    console.log(`[INVENTORY] Deducted ${quantity} units from listing ${listingId} (Order ${orderId})`);

    // Check for low stock
    const availableStock = listing.stock_quantity - listing.reserved_quantity;
    if (availableStock <= listing.low_stock_threshold) {
      console.warn(`[INVENTORY] ⚠️  Low stock alert for listing ${listingId}: ${availableStock} units remaining`);
      // TODO: Trigger notification to vendor
    }

    return {
      deducted: true,
      listing_id: listingId,
      quantity_deducted: quantity,
      remaining_stock: listing.stock_quantity,
      remaining_available: availableStock,
      is_low_stock: availableStock <= listing.low_stock_threshold,
    };
  }

  /**
   * Get low stock listings for a vendor
   */
  async getLowStockListings(vendorId) {
    const listings = await Listing.findAll({
      where: {
        vendor_id: vendorId,
        track_inventory: true,
        stock_quantity: {
          [Op.not]: null,
        },
      },
    });

    const lowStockListings = listings.filter(listing => {
      const availableStock = listing.stock_quantity - listing.reserved_quantity;
      return availableStock <= listing.low_stock_threshold;
    });

    return lowStockListings.map(listing => ({
      listing_id: listing.listing_id,
      title_en: listing.title_en,
      stock_quantity: listing.stock_quantity,
      reserved_quantity: listing.reserved_quantity,
      available_stock: listing.stock_quantity - listing.reserved_quantity,
      low_stock_threshold: listing.low_stock_threshold,
    }));
  }
}

export default new InventoryService();