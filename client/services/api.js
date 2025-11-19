const API_BASE_URL = 'http://localhost:5000/api';

export const api = {
  getProducts: async () => {
    const res = await fetch(`${API_BASE_URL}/products`);
    return res.json();
  },

  addToCart: async (userId, productId, quantity) => {
    const res = await fetch(`${API_BASE_URL}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId, quantity }),
    });
    return res.json();
  },

  createOrder: async (orderData) => {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    return res.json();
  }
};
