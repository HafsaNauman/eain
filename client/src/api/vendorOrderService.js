// /**
//  * Vendor Order Service
//  * Manage vendor orders (requires vendor authentication)
//  */
// import API_CONFIG from './config';
// import apiClient from './client';

// /**
//  * Get all orders for the vendor's shop
//  * @returns {Promise} List of vendor orders
//  */
// export const getVendorOrders = async () => {
//     try {
//         console.log('📤 GET /api/vendor/orders');

//         const response = await apiClient.get('/api/vendor/orders');

//         if (response.data.success) {
//             console.log(`✅ Loaded ${response.data.data.orders.length} vendor orders`);
//             return {
//                 success: true,
//                 data: response.data.data,
//             };
//         } else {
//             return {
//                 success: false,
//                 error: response.data.message || 'Failed to load orders',
//             };
//         }
//     } catch (error) {
//         console.error('❌ Get Vendor Orders Error:', error);
//         return {
//             success: false,
//             error: error.response?.data?.message || error.message || 'Failed to load orders',
//         };
//     }
// };

// /**
//  * Update order status (confirm/cancel)
//  * @param {number} orderId - Order ID
//  * @param {string} status - New status (confirmed/cancelled)
//  * @returns {Promise} Updated order
//  */
// export const updateOrderStatus = async (orderId, status) => {
//     try {
//         console.log(`📤 PUT /api/vendor/orders/${orderId}/status`, { status });

//         const response = await apiClient.put(
//             `/api/vendor/orders/${orderId}/status`,
//             { status }
//         );

//         if (response.data.success) {
//             console.log('✅ Order status updated');
//             return {
//                 success: true,
//                 data: response.data.data,
//             };
//         } else {
//             return {
//                 success: false,
//                 error: response.data.message || 'Failed to update order status',
//             };
//         }
//     } catch (error) {
//         console.error('❌ Update Order Status Error:', error);
//         return {
//             success: false,
//             error: error.response?.data?.message || error.message || 'Failed to update order',
//         };
//     }
// };

// /**
//  * Get specific order details
//  * @param {number} orderId - Order ID
//  * @returns {Promise} Order details
//  */
// export const getVendorOrderDetails = async (orderId) => {
//     try {
//         console.log(`📤 GET /api/vendor/orders/${orderId}`);

//         const response = await apiClient.get(`/api/vendor/orders/${orderId}`);

//         if (response.data.success) {
//             console.log('✅ Order details loaded');
//             return {
//                 success: true,
//                 data: response.data.data.order,
//             };
//         } else {
//             return {
//                 success: false,
//                 error: response.data.message || 'Failed to load order details',
//             };
//         }
//     } catch (error) {
//         console.error('❌ Get Order Details Error:', error);
//         return {
//             success: false,
//             error: error.response?.data?.message || error.message || 'Failed to load order',
//         };
//     }
// };



/**
 * Vendor Order Service
 * Manage vendor orders (requires vendor authentication)
 */
import API_CONFIG from './config';
import apiClient from './client';

/**
 * Get all orders for the vendor's shop
 * @returns {Promise} List of vendor orders
 */
export const getVendorOrders = async () => {
    try {
        console.log('📤 GET /api/orders/vendor/orders');

        const response = await apiClient.get('/api/orders/vendor/orders');

        if (response.data.success) {
            console.log(`✅ Loaded ${response.data.data.orders.length} vendor orders`);
            return {
                success: true,
                data: response.data.data,
            };
        } else {
            return {
                success: false,
                error: response.data.message || 'Failed to load orders',
            };
        }
    } catch (error) {
        console.error('❌ Get Vendor Orders Error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to load orders',
        };
    }
};

/**
 * Update order status (confirm/cancel)
 * @param {number} orderId - Order ID
 * @param {string} status - New status (confirmed/cancelled)
 * @returns {Promise} Updated order
 */
export const updateOrderStatus = async (orderId, status) => {
    try {
        console.log(`📤 PUT /api/orders/vendor/orders/${orderId}/status`, { status });

        const response = await apiClient.put(
            `/api/orders/vendor/orders/${orderId}/status`,
            { status }
        );

        if (response.data.success) {
            console.log('✅ Order status updated');
            return {
                success: true,
                data: response.data.data,
            };
        } else {
            return {
                success: false,
                error: response.data.message || 'Failed to update order status',
            };
        }
    } catch (error) {
        console.error('❌ Update Order Status Error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update order',
        };
    }
};

/**
 * Get specific order details
 * @param {number} orderId - Order ID
 * @returns {Promise} Order details
 */
export const getVendorOrderDetails = async (orderId) => {
    try {
        console.log(`📤 GET /api/orders/vendor/orders/${orderId}`);

        const response = await apiClient.get(`/api/orders/vendor/orders/${orderId}`);

        if (response.data.success) {
            console.log('✅ Order details loaded');
            return {
                success: true,
                data: response.data.data.order,
            };
        } else {
            return {
                success: false,
                error: response.data.message || 'Failed to load order details',
            };
        }
    } catch (error) {
        console.error('❌ Get Order Details Error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to load order',
        };
    }
};
