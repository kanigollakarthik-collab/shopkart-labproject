import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // This is the magic line that sends the HttpOnly cookie
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shopkart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Resource helpers ──────────────────────────────────────────────

export const cartApi = {
  get: () => api.get('/cart'),
  add: (productId) => api.post(`/cart/${productId}`),
  update: (productId, quantity) => api.patch(`/cart/${productId}`, { quantity }),
  remove: (productId) => api.delete(`/cart/${productId}`),
};

export const wishlistApi = {
  get: () => api.get('/wishlist'),
  add: (productId) => api.post(`/wishlist/${productId}`),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};

export const orderApi = {
  paymentConfig: () => api.get('/orders/payment-config'),
  // Only the shipping address is sent — prices & totals are computed by the server
  createPaymentOrder: (shippingAddress) => api.post('/orders/create-payment-order', { shippingAddress }),
  verifyPayment: (payload) => api.post('/orders/verify-payment', payload),
  simulateMockPayment: (shopKartOrderId) => api.post('/orders/mock-payment', { shopKartOrderId }),
  markPaymentFailed: (orderId, reason) => api.post(`/orders/${orderId}/payment-failed`, { reason }),
  list: () => api.get('/orders'),
  get: (orderId) => api.get(`/orders/${orderId}`),
  advanceStatus: (orderId, status) => api.patch(`/orders/${orderId}/status`, status ? { status } : {}),
};

export default api;