// import sequelize from '../config/db.js';
// import User from './users.js';
// import UserVerification from './userVerification.js';
// import VendorProfile from './vendorProfile.js';
// import Listing from './listing.js';

// //associations

// // User ↔ UserVerification (1:N)
// UserVerification.belongsTo(User, { foreignKey: 'user_id' });
// User.hasMany(UserVerification, { foreignKey: 'user_id' });

// // User ↔ VendorProfile (1:1)
// VendorProfile.belongsTo(User, { foreignKey: 'user_id' });
// User.hasOne(VendorProfile, { foreignKey: 'user_id' });

// // VendorProfile ↔ Listing (1:N)
// Listing.belongsTo(VendorProfile, { foreignKey: 'vendor_id' });
// VendorProfile.hasMany(Listing, { foreignKey: 'vendor_id' });

// export { sequelize, User, UserVerification, VendorProfile, Listing  };

import sequelize from '../config/db.js';

import User from './users.js';
import UserVerification from './userVerification.js';
import VendorProfile from './vendorProfile.js';
import Listing from './listing.js';
import Order from './order.js';

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

export { sequelize, User, UserVerification, VendorProfile, Listing, Order };

