import api from '../../shared/utils/api.js';

export const authService = {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    const { user, token } = response.data.data;
    
    // Store in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { user, token };
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    const { user, token } = response.data.data;
    
    // Store in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { user, token };
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data.data.user;
  },

  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', profileData);
    const user = response.data.data.user;
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  },

  async changePassword(passwordData) {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },

  async refreshToken() {
    const response = await api.post('/auth/refresh');
    const { user, token } = response.data.data;
    
    // Update localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { user, token };
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};