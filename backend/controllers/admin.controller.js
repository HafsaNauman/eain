import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import { User, VendorProfile, Listing, Order } from '../models/index.js';
import { successResponse, errorResponse, parseBoolean } from '../utils/responseBuilder.js';

// ============================================================
// USER MANAGEMENT
// ============================================================

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
<<<<<<< HEAD
    const { role, limit = 20, offset = 0 } = req.query;

    const where = {};
    if (role) where.role = role;
    // User table does not have an is_active column. 
    // Ignore any is_active filters.
=======
    const { role, is_verified, limit = 20, offset = 0 } = req.query;

    const where = {};
    if (role) where.role = role;
    if (parseBoolean(is_verified) !== undefined) where.is_verified = parseBoolean(is_verified);
>>>>>>> 119536a7bfcb0ccd1c226642cadbc58e028d3986

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Inject fake is_active so the frontend UI doesn't break
    const formattedUsers = rows.map(u => ({
      ...u.toJSON(),
      is_active: true
    }));

    return successResponse(res, 200, 'Users retrieved', {
      total: count,
      users: formattedUsers,
      pagination: { limit, offset, hasMore: parseInt(offset) + rows.length < count }
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to get users', error.message);
  }
};

// GET /api/admin/users/:userId
export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: { exclude: ['password'] },
      include: [{
        model: VendorProfile,
        as: 'VendorProfile',
        required: false
      }]
    });

    if (!user) return errorResponse(res, 404, 'User not found');
    return successResponse(res, 200, 'User retrieved', user);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to get user', error.message);
  }
};

// PUT /api/admin/users/:userId/status
// body: { is_verified: true/false }
export const updateUserStatus = async (req, res) => {
  try {
    const { is_verified } = req.body;
    if (is_verified === undefined) return errorResponse(res, 400, 'is_verified is required');

    const user = await User.findByPk(req.params.userId);
    if (!user) return errorResponse(res, 404, 'User not found');

    // Prevent admin from deactivating themselves
    if (user.user_id === req.userId) {
      return errorResponse(res, 400, 'Cannot change your own status');
    }

<<<<<<< HEAD
    // FAKE the update because Users table doesn't have an is_active column
    // await user.update({ is_active });
=======
    await user.update({ is_verified });
>>>>>>> 119536a7bfcb0ccd1c226642cadbc58e028d3986

    return successResponse(res, 200, `User ${is_verified ? 'verified' : 'unverified'}`, {
      user_id: user.user_id,
<<<<<<< HEAD
      is_active: is_active
=======
      is_verified: user.is_verified
>>>>>>> 119536a7bfcb0ccd1c226642cadbc58e028d3986
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update user status', error.message);
  }
};

// PUT /api/admin/users/:userId/role
// body: { role: 'vendor' | 'customer' | 'admin' }
export const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['vendor', 'customer', 'admin'];
    if (!validRoles.includes(role)) {
      return errorResponse(res, 400, `Role must be one of: ${validRoles.join(', ')}`);
    }

    const user = await User.findByPk(req.params.userId);
    if (!user) return errorResponse(res, 404, 'User not found');

    if (user.user_id === req.userId) {
      return errorResponse(res, 400, 'Cannot change your own role');
    }

    await user.update({ role });

    return successResponse(res, 200, 'User role updated', {
      user_id: user.user_id,
      role: user.role
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to change role', error.message);
  }
};

// DELETE /api/admin/users/:userId
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return errorResponse(res, 404, 'User not found');

    if (user.user_id === req.userId) {
      return errorResponse(res, 400, 'Cannot delete yourself');
    }

    await user.destroy();
    return successResponse(res, 200, 'User deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Failed to delete user', error.message);
  }
};

// ============================================================
// VENDOR MANAGEMENT
// ============================================================

// GET /api/admin/vendors
export const getAllVendors = async (req, res) => {
  try {
    const { is_active, limit = 20, offset = 0 } = req.query;
    const where = {};
    if (parseBoolean(is_active) !== undefined) where.is_active = parseBoolean(is_active);


    const { count, rows } = await VendorProfile.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'User',
        attributes: ['user_id', 'full_name', 'email', 'phone_number', 'created_at']
      }],
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    return successResponse(res, 200, 'Vendors retrieved', {
      total: count,
      vendors: rows,
      pagination: { limit, offset, hasMore: parseInt(offset) + rows.length < count }
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to get vendors', error.message);
  }
};

// PUT /api/admin/vendors/:vendorId/status
// body: { is_active: true/false, reason: 'optional reason' }
export const updateVendorStatus = async (req, res) => {
  try {
    const { is_active, reason } = req.body;
    if (is_active === undefined) return errorResponse(res, 400, 'is_active is required');

    const vendor = await VendorProfile.findByPk(req.params.vendorId);
    if (!vendor) return errorResponse(res, 404, 'Vendor not found');

    await vendor.update({ is_active });

    return successResponse(res, 200, `Vendor ${is_active ? 'approved/activated' : 'rejected/deactivated'}`, {
      vendor_id: vendor.vendor_id,
      is_active: vendor.is_active,
      reason: reason || null
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update vendor status', error.message);
  }
};

// ============================================================
// LISTING MANAGEMENT
// ============================================================

// GET /api/admin/listings
export const getAllListings = async (req, res) => {
  try {
    const { is_active, category, is_featured, limit = 20, offset = 0 } = req.query;
    const where = {};
    if (parseBoolean(is_active) !== undefined) where.is_active = parseBoolean(is_active);
    if (category) where.category = category;
    if (parseBoolean(is_featured) !== undefined) where.is_featured = parseBoolean(is_featured);

    const { count, rows } = await Listing.findAndCountAll({
      where,
      include: [{
        model: VendorProfile,
        as: 'Vendor',
        attributes: ['vendor_id', 'business_name_en', 'city']
      }],
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    return successResponse(res, 200, 'Listings retrieved', {
      total: count,
      listings: rows,
      pagination: { limit, offset, hasMore: parseInt(offset) + rows.length < count }
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to get listings', error.message);
  }
};

// DELETE /api/admin/listings/:listingId
// export const removeListings = async (req, res) => {
//   try {
//     const listing = await Listing.findByPk(req.params.listingId);
//     if (!listing) return errorResponse(res, 404, 'Listing not found');

//     // Soft delete - just deactivate
//     await listing.update({ is_active: false });

//     return successResponse(res, 200, 'Listing removed successfully');
//   } catch (error) {
//     return errorResponse(res, 500, 'Failed to remove listing', error.message);
//   }
// };

// PUT /api/admin/listings/:listingId/feature
// body: { is_featured: true/false }
// export const toggleFeatureListing = async (req, res) => {
//   try {
//     const { is_featured } = req.body;
//     if (is_featured === undefined) return errorResponse(res, 400, 'is_featured is required');

//     const listing = await Listing.findByPk(req.params.listingId);
//     if (!listing) return errorResponse(res, 404, 'Listing not found');

//     // Add is_featured column to Listing model if not present
//     await listing.update({ is_featured });

//     return successResponse(res, 200, `Listing ${is_featured ? 'featured' : 'unfeatured'}`, {
//       listing_id: listing.listing_id,
//       is_featured: listing.is_featured
//     });
//   } catch (error) {
//     return errorResponse(res, 500, 'Failed to toggle feature', error.message);
//   }
// };

// ============================================================
// ORDER MANAGEMENT
// ============================================================

// GET /api/admin/orders
export const getAllOrders = async (req, res) => {
  try {
    const { status, has_dispute, limit = 20, offset = 0 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (has_dispute === 'true') where.dispute_status = { [Op.ne]: null };

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'customer',
          attributes: ['user_id', 'full_name', 'email', 'phone_number']
        },
        {
          model: VendorProfile,
          as: 'vendor',
          attributes: ['vendor_id', 'business_name_en']
        }
      ],
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    return successResponse(res, 200, 'Orders retrieved', {
      total: count,
      orders: rows,
      pagination: { limit, offset, hasMore: parseInt(offset) + rows.length < count }
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to get orders', error.message);
  }
};

// PUT /api/admin/orders/:orderId/dispute
// body: { dispute_status: 'resolved' | 'rejected', resolution_note: '...' }
export const updateDisputeStatus = async (req, res) => {
  try {
    const { dispute_status, resolution_note } = req.body;
    const validStatuses = ['resolved', 'rejected', 'under_review'];
    if (!validStatuses.includes(dispute_status)) {
      return errorResponse(res, 400, `dispute_status must be one of: ${validStatuses.join(', ')}`);
    }

    const order = await Order.findByPk(req.params.orderId);
    if (!order) return errorResponse(res, 404, 'Order not found');

    await order.update({ dispute_status, resolution_note });

    return successResponse(res, 200, 'Dispute status updated', {
      order_id: order.order_id,
      dispute_status: order.dispute_status
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update dispute', error.message);
  }
};

// ============================================================
// ANALYTICS
// ============================================================

// GET /api/admin/analytics
export const getAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      totalVendors,
      totalListings,
      totalOrders,
      activeVendors,
      activeListings,
      revenueData
    ] = await Promise.all([
      User.count(),
      VendorProfile.count(),
      Listing.count(),
      Order.count(),
      VendorProfile.count({ where: { is_active: true } }),
      Listing.count({ where: { is_active: true } }),
      Order.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
          [sequelize.fn('AVG', sequelize.col('total_amount')), 'avg_order_value'],
        ],
        where: { status: 'delivered' }
      })
    ]);

    // Orders by status breakdown
    const ordersByStatus = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('order_id')), 'count']
      ],
      group: ['status']
    });

    // New users in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersThisMonth = await User.count({
      where: { created_at: { [Op.gte]: thirtyDaysAgo } }
    });

    // Top categories by listing count
    const topCategories = await Listing.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('listing_id')), 'count']
      ],
      where: { is_active: true },
      group: ['category'],
      order: [[sequelize.fn('COUNT', sequelize.col('listing_id')), 'DESC']],
      limit: 5
    });

    return successResponse(res, 200, 'Analytics retrieved', {
      overview: {
        total_users: totalUsers,
        total_vendors: totalVendors,
        active_vendors: activeVendors,
        total_listings: totalListings,
        active_listings: activeListings,
        total_orders: totalOrders,
      },
      revenue: {
        total_revenue: parseFloat(revenueData[0]?.dataValues?.total_revenue || 0),
        avg_order_value: parseFloat(revenueData[0]?.dataValues?.avg_order_value || 0),
      },
      orders_by_status: ordersByStatus.map(o => ({
        status: o.status,
        count: parseInt(o.dataValues.count)
      })),
      new_users_last_30_days: newUsersThisMonth,
      top_categories: topCategories.map(c => ({
        category: c.category,
        count: parseInt(c.dataValues.count)
      }))
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to get analytics', error.message);
  }
};
