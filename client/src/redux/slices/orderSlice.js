// src/redux/slices/orderSlice.js
import { createSlice } from '@reduxjs/toolkit';

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    setOrders: (state, action) => {
      state.list = action.payload;
    },
    updateOrderStatus: (state, action) => {
      const { orderId, status, updated_at } = action.payload;
      const order = state.list.find((o) => o.order_id === orderId);
      if (order) {
        order.status = status;
        if (updated_at) {
          // bina hard‑code field ke backend ke hisaab se
          order[status] = updated_at;
        }
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setOrders, updateOrderStatus, setLoading, setError } =
  orderSlice.actions;

export const selectOrders = (state) => state.orders.list;
export const selectOrdersStatus = (state) => state.orders.loading;

export default orderSlice.reducer;
