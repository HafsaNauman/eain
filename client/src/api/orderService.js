/**
 * Order Service
 * Handle customer orders (requires authentication)
 */
import API_CONFIG from './config';
import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Place a new order
 * @param {Object} orderData - Order details
 * @returns {Promise} Order confirmation
 */
export const placeOrder = async (orderData) => {
    try {
        console.log('📤 POST /api/orders');
        console.log('Order data:', orderData);

        const response = await apiClient.post('/api/orders', orderData);

        if (response.data.success) {
            console.log('✅ Order placed successfully');
            return {
                success: true,
                data: response.data.data,
            };
        } else {
            return {
                success: false,
                error: response.data.message || 'Failed to place order',
            };
        }
    } catch (error) {
        console.error('❌ Place Order Error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to place order',
        };
    }
};

/**
 * Get customer's orders
 * @returns {Promise} List of orders
 */
export const getMyOrders = async () => {
    try {
        console.log('📤 GET /api/orders/my');

        const response = await apiClient.get('/api/orders/my');

        if (response.data.success) {
            console.log(`✅ Loaded ${response.data.data.orders.length} orders`);
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
        console.error('❌ Get My Orders Error:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to load orders',
        };
    }
};

/**
 * Get order details by ID
 * @param {number} orderId - Order ID
 * @returns {Promise} Order details
 */
export const getOrderDetails = async (orderId) => {
    try {
        console.log(`📤 GET /api/orders/${orderId}`);

        const response = await apiClient.get(`/api/orders/${orderId}`);

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
