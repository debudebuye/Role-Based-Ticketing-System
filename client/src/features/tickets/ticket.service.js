import api from '../../shared/utils/api.js';

export const ticketService = {
  async getAllTickets(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const response = await api.get(`/tickets?${queryParams.toString()}`);
    return response.data.data;
  },

  async getTicketById(id) {
    const response = await api.get(`/tickets/${id}`);
    return response.data.data.ticket;
  },

  async createTicket(ticketData) {
    // Process tags if they're a string
    if (typeof ticketData.tags === 'string') {
      ticketData.tags = ticketData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }
    
    const response = await api.post('/tickets', ticketData);
    return response.data.data.ticket;
  },

  async updateTicket(id, updateData) {
    const response = await api.put(`/tickets/${id}`, updateData);
    return response.data.data.ticket;
  },

  async deleteTicket(id) {
    const response = await api.delete(`/tickets/${id}`);
    return response.data;
  },

  async assignTicket(id, agentId) {
    const response = await api.put(`/tickets/${id}/assign`, { assignedTo: agentId });
    return response.data.data.ticket;
  },



  async acceptTicket(id) {
    const response = await api.put(`/tickets/${id}/accept`);
    return response.data.data.ticket;
  },

  async rejectTicket(id, reason) {
    const response = await api.put(`/tickets/${id}/reject`, { reason });
    return response.data.data.ticket;
  },

  async getTicketStats() {
    const response = await api.get('/tickets/stats');
    return response.data.data.stats;
  }
};