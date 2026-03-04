// src/context/InventoryContext.js
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { getVendorListings } from '../api/listingService';

const InventoryContext = createContext();

const initialState = {
  listings: [],
  listingsLoading: false,
  listingsError: null,
  lowStockListings: [],
};

const types = {
  FETCH_LISTINGS_START: 'FETCH_LISTINGS_START',
  FETCH_LISTINGS_SUCCESS: 'FETCH_LISTINGS_SUCCESS',
  FETCH_LISTINGS_ERROR: 'FETCH_LISTINGS_ERROR',

  POPULATE_LOW_STOCK: 'POPULATE_LOW_STOCK',
};

const inventoryReducer = (state, action) => {
  switch (action.type) {
    case types.FETCH_LISTINGS_START:
      return {
        ...state,
        listingsLoading: true,
        listingsError: null,
      };
    case types.FETCH_LISTINGS_SUCCESS:
      return {
        ...state,
        listingsLoading: false,
        listings: action.payload,
        listingsError: null,
      };
    case types.FETCH_LISTINGS_ERROR:
      return {
        ...state,
        listingsLoading: false,
        listingsError: action.payload,
        listings: [],
      };

    case types.POPULATE_LOW_STOCK:
      return {
        ...state,
        lowStockListings: action.payload,
      };

    default:
      return state;
  }
};

export const InventoryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(inventoryReducer, initialState);

  const fetchListings = useCallback(async () => {
    dispatch({ type: types.FETCH_LISTINGS_START });
    try {
      const res = await getVendorListings();
      if (res.success) {
        dispatch({ type: types.FETCH_LISTINGS_SUCCESS, payload: res.data.listings });
      } else {
        dispatch({ type: types.FETCH_LISTINGS_ERROR, payload: res.error });
      }
    } catch (err) {
      dispatch({ type: types.FETCH_LISTINGS_ERROR, payload: err.message });
    }
  }, []);

  const populateLowStockListings = useCallback(() => {
    const low = (state.listings || []).filter((listing) => {
      if (!listing.track_inventory || listing.stock_quantity == null) return false;
      const available = Math.max(0, listing.stock_quantity - listing.reserved_quantity);
      const threshold = listing.low_stock_threshold || 5;
      return available < threshold;
    });
    dispatch({ type: types.POPULATE_LOW_STOCK, payload: low });
  }, [state.listings]);

  const value = {
    ...state,
    fetchListings,
    populateLowStockListings,
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within InventoryProvider');
  }
  return context;
};
    