// src/redux/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isLoading: false,
    user: null,
    isAuthenticated: false,
    isVendor: false,
    profile: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isVendor = action.payload?.role === 'vendor';
    },
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.profile = null;
      state.isAuthenticated = false;
      state.isVendor = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setUser, setProfile, logout, setLoading } = authSlice.actions;

export const selectAuth = (state) => state.auth;

export default authSlice.reducer;
