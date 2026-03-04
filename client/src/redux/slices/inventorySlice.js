import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchLowStockListings = createAsyncThunk(
  'inventory/fetchLowStock',
  async (_, { getState }) => {
    const { auth } = getState();
    const response = await fetch(`${API_BASE_URL}/vendor/inventory/low-stock`, {
      headers: { Authorization: `Bearer ${auth.user?.accessToken}` }
    });
    return response.json();
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: { lowStock: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchLowStockListings.fulfilled, (state, action) => {
      state.lowStock = action.payload.data.low_stock_listings;
    });
  },
});

export default inventorySlice.reducer;
