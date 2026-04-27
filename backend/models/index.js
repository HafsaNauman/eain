import sequelize from '../config/db.js';
import User from './users.js';
import UserVerification from './userVerification.js';
import VendorProfile from './vendorProfile.js';
import Listing from './listing.js';
import Order from './order.js';
import OrderHistory from './orderHistory.js';
import { Payout, VendorCommissionRate, PayoutBatch, PayoutBatchItem } from './payout.js';
import Booking from './booking.js';
import ServiceAvailability from './serviceAvailability.js';
import RecommendationEvent from './recommendationEvent.js';

//====== Associations ======

// User ↔ UserVerification (1:N)
UserVerification.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(UserVerification, { foreignKey: 'user_id' });

// User ↔ VendorProfile (1:1)
VendorProfile.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(VendorProfile, { foreignKey: 'user_id' });

// VendorProfile ↔ Listing (1:N)
// Listing.belongsTo(VendorProfile, { foreignKey: 'vendor_id' });
Listing.belongsTo(VendorProfile, { foreignKey: 'vendor_id', as: 'Vendor' });

VendorProfile.hasMany(Listing, { foreignKey: 'vendor_id' });

// ===== NEW: Order Associations =====

// User (as customer) ↔ Order (1:N)
Order.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });
User.hasMany(Order, { foreignKey: 'customer_id', as: 'orders_as_customer' });

// VendorProfile ↔ Order (1:N)
Order.belongsTo(VendorProfile, { foreignKey: 'vendor_id', as: 'vendor' });
VendorProfile.hasMany(Order, { foreignKey: 'vendor_id', as: 'orders' });

// Listing ↔ Order (1:N)
Order.belongsTo(Listing, { foreignKey: 'listing_id', as: 'listing' });
Listing.hasMany(Order, { foreignKey: 'listing_id', as: 'orders' });

// Add associations (after existing associations)
Order.hasMany(OrderHistory, { foreignKey: 'order_id', as: 'history' });
OrderHistory.belongsTo(Order, { foreignKey: 'order_id' });

Order.hasOne(Payout, { foreignKey: 'order_id', as: 'payout' });
Payout.belongsTo(Order, { foreignKey: 'order_id' });

// Assuming you have VendorProfile model
VendorProfile.hasMany(Payout, { foreignKey: 'vendor_id', as: 'payouts' });
Payout.belongsTo(VendorProfile, { foreignKey: 'vendor_id' });

VendorProfile.hasMany(VendorCommissionRate, { foreignKey: 'vendor_id', as: 'commission_rates' });
VendorCommissionRate.belongsTo(VendorProfile, { foreignKey: 'vendor_id' });

PayoutBatch.hasMany(PayoutBatchItem, { foreignKey: 'batch_id', as: 'items' });
PayoutBatchItem.belongsTo(PayoutBatch, { foreignKey: 'batch_id' });

Payout.hasMany(PayoutBatchItem, { foreignKey: 'payout_id', as: 'batch_items' });
PayoutBatchItem.belongsTo(Payout, { foreignKey: 'payout_id' });

// ── Booking Associations ──
Booking.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });
User.hasMany(Booking, { foreignKey: 'customer_id', as: 'bookings_as_customer' });

Booking.belongsTo(VendorProfile, { foreignKey: 'vendor_id', as: 'serviceProvider' });
VendorProfile.hasMany(Booking, { foreignKey: 'vendor_id', as: 'bookings' });

Booking.belongsTo(Listing, { foreignKey: 'listing_id', as: 'serviceListing' });
Listing.hasMany(Booking, { foreignKey: 'listing_id', as: 'bookings' });

// ── ServiceAvailability Associations ──
ServiceAvailability.belongsTo(VendorProfile, { foreignKey: 'vendor_id' });
VendorProfile.hasMany(ServiceAvailability, { foreignKey: 'vendor_id', as: 'availability' });

// RecommendationEvent associations
RecommendationEvent.belongsTo(User, { foreignKey: 'user_id' });
RecommendationEvent.belongsTo(Listing, { foreignKey: 'listing_id' });

export {
    sequelize, User, UserVerification, VendorProfile, Listing, Order
    , OrderHistory, Payout, VendorCommissionRate, PayoutBatch, PayoutBatchItem, Booking, ServiceAvailability, 
    RecommendationEvent
};

