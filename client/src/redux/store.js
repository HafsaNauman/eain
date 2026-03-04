// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import orderReducer from './slices/orderSlice';
import productReducer from './slices/productSlice';
import cartReducer from './slices/cartSlice';
import inventoryReducer from './slices/inventorySlice'; // ← ADD
const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: orderReducer,
    products: productReducer,
    cart: cartReducer,
    inventory: inventoryReducer,
  },
  devTools: __DEV__, // ya true, depends on your env
});

export default store;
