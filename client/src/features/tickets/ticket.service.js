import api from '../../shared/utils/api.js';

export const ticketService = {
  async getAllTickets(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      console.log('Fetching tickets with params:', params);
      const response = await api.get(`/tickets?${queryParams.toString()}`);
      console.log('Tickets response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
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
    try {
      console.log('Fetching ticket stats...');
      const response = await api.get('/tickets/stats');
      console.log('Stats response:', response.data);
      return response.data.data.stats;
    } catch (error) {
      console.error('Error fetching ticket stats:', error);
      throw error;
    }
  }
};