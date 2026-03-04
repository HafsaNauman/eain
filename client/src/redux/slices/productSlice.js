// src/redux/slices/productSlice.js
import { createSlice } from '@reduxjs/toolkit';

const productSlice = createSlice({
  name: 'products',
  initialState: {
    listings: [],
    loading: false,
    error: null,
  },
  reducers: {
    setListings: (state, action) => {
      state.listings = action.payload;
    },
    updateStock: (state, action) => {
      const { productId, stock_quantity, available } = action.payload;
      const product = state.listings.find((p) => p.id === productId);
      if (product) {
        product.stock_quantity = stock_quantity;
        product.available = available;
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

export const { setListings, updateStock, setLoading, setError } =
  productSlice.actions;

export const selectProducts = (state) => state.products.listings;
export const selectProductById = (id) => (state) =>
  state.products.listings.find((p) => p.id === id);

export default productSlice.reducer;
