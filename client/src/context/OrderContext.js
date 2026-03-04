// src/context/OrderContext.js
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { getOrderDetails, getMyOrders } from '../api/orderService';
import { getVendorOrderDetails, getVendorOrders, updateOrderStatus } from '../api/vendorOrderService';

const OrderContext = createContext();

// Initial state
const initialState = {
  currentOrder: null,
  currentOrderLoading: false,
  currentOrderError: null,
  myOrders: [],
  myOrdersLoading: false,
  myOrdersError: null,
  vendorOrders: [],
  vendorOrdersLoading: false,
  vendorOrdersError: null,
  allowedActions: [], // from backend, if you expose /orders/:id/available-actions
};

// Actions
const types = {
  FETCH_ORDER_START: 'FETCH_ORDER_START',
  FETCH_ORDER_SUCCESS: 'FETCH_ORDER_SUCCESS',
  FETCH_ORDER_ERROR: 'FETCH_ORDER_ERROR',

  FETCH_MY_ORDERS_START: 'FETCH_MY_ORDERS_START',
  FETCH_MY_ORDERS_SUCCESS: 'FETCH_MY_ORDERS_SUCCESS',
  FETCH_MY_ORDERS_ERROR: 'FETCH_MY_ORDERS_ERROR',

  FETCH_VENDOR_ORDERS_START: 'FETCH_VENDOR_ORDERS_START',
  FETCH_VENDOR_ORDERS_SUCCESS: 'FETCH_VENDOR_ORDERS_SUCCESS',
  FETCH_VENDOR_ORDERS_ERROR: 'FETCH_VENDOR_ORDERS_ERROR',

  UPDATE_ORDER_STATUS_START: 'UPDATE_ORDER_STATUS_START',
  UPDATE_ORDER_STATUS_SUCCESS: 'UPDATE_ORDER_STATUS_SUCCESS',
  UPDATE_ORDER_STATUS_ERROR: 'UPDATE_ORDER_STATUS_ERROR',

  SET_ALLOWED_ACTIONS: 'SET_ALLOWED_ACTIONS',
};

const orderReducer = (state, action) => {
  switch (action.type) {
    case types.FETCH_ORDER_START:
      return {
        ...state,
        currentOrderLoading: true,
        currentOrderError: null,
      };
    case types.FETCH_ORDER_SUCCESS:
      return {
        ...state,
        currentOrderLoading: false,
        currentOrder: action.payload,
        currentOrderError: null,
      };
    case types.FETCH_ORDER_ERROR:
      return {
        ...state,
        currentOrderLoading: false,
        currentOrderError: action.payload,
        currentOrder: null,
      };

    case types.FETCH_MY_ORDERS_START:
      return {
        ...state,
        myOrdersLoading: true,
        myOrdersError: null,
      };
    case types.FETCH_MY_ORDERS_SUCCESS:
      return {
        ...state,
        myOrdersLoading: false,
        myOrders: action.payload,
        myOrdersError: null,
      };
    case types.FETCH_MY_ORDERS_ERROR:
      return {
        ...state,
        myOrdersLoading: false,
        myOrdersError: action.payload,
        myOrders: [],
      };

    case types.FETCH_VENDOR_ORDERS_START:
      return {
        ...state,
        vendorOrdersLoading: true,
        vendorOrdersError: null,
      };
    case types.FETCH_VENDOR_ORDERS_SUCCESS:
      return {
        ...state,
        vendorOrdersLoading: false,
        vendorOrders: action.payload,
        vendorOrdersError: null,
      };
    case types.FETCH_VENDOR_ORDERS_ERROR:
      return {
        ...state,
        vendorOrdersLoading: false,
        vendorOrdersError: action.payload,
        vendorOrders: [],
      };

    case types.UPDATE_ORDER_STATUS_START:
      return {
        ...state,
        currentOrderLoading: true,
      };
    case types.UPDATE_ORDER_STATUS_SUCCESS:
      return {
        ...state,
        currentOrderLoading: false,
        currentOrder: action.payload,
      };
    case types.UPDATE_ORDER_STATUS_ERROR:
      return {
        ...state,
        currentOrderLoading: false,
        currentOrderError: action.payload,
      };

    case types.SET_ALLOWED_ACTIONS:
      return {
        ...state,
        allowedActions: action.payload,
      };

    default:
      return state;
  }
};

// Provider
export const OrderProvider = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, initialState);

  // Customer: get order details
  const fetchOrder = useCallback(async (orderId) => {
    dispatch({ type: types.FETCH_ORDER_START });
    try {
      const res = await getOrderDetails(orderId);
      if (res.success) {
        dispatch({ type: types.FETCH_ORDER_SUCCESS, payload: res.data });
      } else {
        dispatch({ type: types.FETCH_ORDER_ERROR, payload: res.error });
      }
    } catch (err) {
      dispatch({ type: types.FETCH_ORDER_ERROR, payload: err.message });
    }
  }, []);

  // Customer: get my orders
  const fetchMyOrders = useCallback(async () => {
    dispatch({ type: types.FETCH_MY_ORDERS_START });
    try {
      const res = await getMyOrders();
      if (res.success) {
        dispatch({ type: types.FETCH_MY_ORDERS_SUCCESS, payload: res.data.orders });
      } else {
        dispatch({ type: types.FETCH_MY_ORDERS_ERROR, payload: res.error });
      }
    } catch (err) {
      dispatch({ type: types.FETCH_MY_ORDERS_ERROR, payload: err.message });
    }
  }, []);

  // Vendor: get vendor orders
  const fetchVendorOrders = useCallback(async () => {
    dispatch({ type: types.FETCH_VENDOR_ORDERS_START });
    try {
      const res = await getVendorOrders();
      if (res.success) {
        dispatch({ type: types.FETCH_VENDOR_ORDERS_SUCCESS, payload: res.data.orders });
      } else {
        dispatch({ type: types.FETCH_VENDOR_ORDERS_ERROR, payload: res.error });
      }
    } catch (err) {
      dispatch({ type: types.FETCH_VENDOR_ORDERS_ERROR, payload: err.message });
    }
  }, []);

  // Update order status (vendor or admin)
  const updateOrderStatusAction = useCallback(async (orderId, status, extraData = {}) => {
    dispatch({ type: types.UPDATE_ORDER_STATUS_START });
    try {
      const res = await updateOrderStatus(orderId, { status, ...extraData });
      if (res.success) {
        dispatch({ type: types.UPDATE_ORDER_STATUS_SUCCESS, payload: res.data });
      } else {
        dispatch({ type: types.UPDATE_ORDER_STATUS_ERROR, payload: res.error });
      }
      return res;
    } catch (err) {
      dispatch({ type: types.UPDATE_ORDER_STATUS_ERROR, payload: err.message });
      return { success: false, error: err.message };
    }
  }, []);

  // You can plug in /orders/:id/available-actions here later
  const setAllowedActions = useCallback((actions) => {
    dispatch({ type: types.SET_ALLOWED_ACTIONS, payload: actions });
  }, []);

  const value = {
    ...state,
    fetchOrder,
    fetchMyOrders,
    fetchVendorOrders,
    updateOrderStatus: updateOrderStatusAction,
    setAllowedActions,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within OrderProvider');
  }
  return context;
};
