// src/redux/slices/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    error: null,
  },
  reducers: {
    addItem: (state, action) => {
      const { product, quantity } = action.payload;
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ product, quantity });
      }
    },
    removeItem: (state, action) => {
      const { productId } = action.payload;
      state.items = state.items.filter((i) => i.product.id !== productId);
    },
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((i) => i.product.id === productId);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(
            (i) => i.product.id !== productId
          );
        } else {
          item.quantity = quantity;
        }
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
    setStockError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, setStockError, clearError } =
  cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) => state.cart.items.length;
export const selectCartTotal = (state) =>
  state.cart.items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );

export default cartSlice.reducer;
