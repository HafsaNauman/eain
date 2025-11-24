import sequelize from '../config/db.js';
import User from './users.js';
import UserVerification from './userVerification.js';
import VendorProfile from './vendorProfile.js';
import Listing from './listing.js';

//associations

// User ↔ UserVerification (1:N)
UserVerification.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(UserVerification, { foreignKey: 'user_id' });

// User ↔ VendorProfile (1:1)
VendorProfile.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(VendorProfile, { foreignKey: 'user_id' });

// VendorProfile ↔ Listing (1:N)
Listing.belongsTo(VendorProfile, { foreignKey: 'vendor_id' });
VendorProfile.hasMany(Listing, { foreignKey: 'vendor_id' });

export { sequelize, User, UserVerification, VendorProfile, Listing  };


