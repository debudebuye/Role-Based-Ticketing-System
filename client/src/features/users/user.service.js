import api from '../../shared/utils/api.js';

export const userService = {
  async getAllUsers(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const response = await api.get(`/users?${queryParams.toString()}`);
    return response.data.data;
  },

  async getUserById(id) {
    const response = await api.get(`/users/${id}`);
    return response.data.data.user;
  },

  async createUser(userData) {
    const response = await api.post('/users', userData);
    return response.data.data.user;
  },

  async updateUser(id, updateData) {
    const response = await api.put(`/users/${id}`, updateData);
    return response.data.data.user;
  },

  async deleteUser(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  async getAgents() {
    const response = await api.get('/users/agents');
    return response.data.data.agents;
  },

  async getUserStats() {
    const response = await api.get('/users/stats');
    return response.data.data.stats;
  }
};