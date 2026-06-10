import DOMPurify from 'dompurify';
import api, { tokenStore } from '../../shared/utils/api.js';

// Sanitize all string fields in an object before sending to the server
const sanitize = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, typeof v === 'string' ? DOMPurify.sanitize(v) : v])
  );
};

export const authService = {
  async login(credentials) {
    const response = await api.post('/auth/login', sanitize(credentials));
    // Server sets the refresh token as an HttpOnly cookie automatically.
    // We only store the short-lived access token client-side.
    const { user, accessToken } = response.data.data;
    tokenStore.setAccess(accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    return { user, accessToken };
  },

  async register(userData) {
    const response = await api.post('/auth/register', sanitize(userData));
    const { user, accessToken } = response.data.data;
    tokenStore.setAccess(accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    return { user, accessToken };
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data.data.user;
  },

  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', sanitize(profileData));
    const user = response.data.data.user;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  async changePassword(passwordData) {
    const response = await api.put('/auth/change-password', passwordData);
    // Server clears the refresh cookie on password change — clear access token too
    tokenStore.clearTokens();
    return response.data;
  },

  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  logout() {
    // Send the logout request BEFORE clearing the token so the Authorization
    // header is still present when the server receives it.
    // Fire-and-forget — clears the HttpOnly cookie server-side.
    api.post('/auth/logout').catch(() => {});
    // Clear client-side tokens after scheduling the request (same tick is fine —
    // axios queues the request before the token is read from memory).
    tokenStore.clearTokens();
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const str = localStorage.getItem('user');
    return str ? JSON.parse(str) : null;
  },

  getToken() {
    return tokenStore.getAccess();
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};
