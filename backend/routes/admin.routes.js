// import express from 'express';
// import { verifyJWT, isAdmin } from '../middlewares/authJwt.js';
// import { successResponse, errorResponse } from '../utils/responseBuilder.js';
// import { User } from '../models/index.js';

// const router = express.Router();


// // Admin routes - require JWT token + admin role


// // Get all users (admin only)
// router.get('/users', [verifyJWT, isAdmin], async (req, res) => {
//   try {
//     const users = await User.findAll({
//       attributes: { exclude: ['password_hash'] }
//     });

//     return successResponse(res, 200, 'Users retrieved successfully', { users });
//   } catch (error) {
//     return errorResponse(res, 500, 'Error retrieving users', error.message);
//   }
// });

// // Delete user (admin only)
// router.delete('/users/:userId', [verifyJWT, isAdmin], async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const user = await User.findByPk(userId);
//     if (!user) {
//       return errorResponse(res, 404, 'User not found');
//     }

//     await user.destroy();

//     return successResponse(res, 200, 'User deleted successfully');
//   } catch (error) {
//     return errorResponse(res, 500, 'Error deleting user', error.message);
//   }
// });

// export default router;

import express from 'express';
import { verifyJWT, isAdmin } from '../middlewares/authJwt.js';
import {
  getAllUsers, getUserById, updateUserStatus,
  changeUserRole, deleteUser,
  getAllVendors, updateVendorStatus,
  getAllListings,
  getAllOrders, updateDisputeStatus,
  getAnalytics
} from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes require JWT + isAdmin
router.use(verifyJWT, isAdmin);

// ── User Management ──────────────────────────────────────
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId/status', updateUserStatus);      // activate/deactivate
router.put('/users/:userId/role', changeUserRole);          // vendor <-> customer
router.delete('/users/:userId', deleteUser);

// ── Vendor Management ────────────────────────────────────
router.get('/vendors', getAllVendors);
router.put('/vendors/:vendorId/status', updateVendorStatus); // approve/reject/deactivate

// ── Listing Management ───────────────────────────────────
router.get('/listings', getAllListings);
// router.delete('/listings/:listingId', removeListings);
// router.put('/listings/:listingId/feature', toggleFeatureListing);

// ── Order Management ─────────────────────────────────────
router.get('/orders', getAllOrders);
router.put('/orders/:orderId/dispute', updateDisputeStatus);

// ── Analytics ────────────────────────────────────────────
router.get('/analytics', getAnalytics);

export default router;
