// Create: src/api/cartService.js
export const validateCartStock = async (cartItems) => {
  return { valid: true, message: '' }; // Mock for now
};

export const getListingDetails = async (listingId) => {
  return { 
    success: true, 
    data: { stock_quantity: 10, reserved_quantity: 0, track_inventory: true }
  }; // Mock
};
