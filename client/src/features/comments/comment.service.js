import api from '../../shared/utils/api.js';

export const commentService = {
  async getTicketComments(ticketId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const response = await api.get(`/comments/ticket/${ticketId}?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  async createComment(ticketId, commentData) {
    try {
      const response = await api.post(`/comments/ticket/${ticketId}`, commentData);
      return response.data.data.comment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

  async updateComment(commentId, updateData) {
    try {
      const response = await api.put(`/comments/${commentId}`, updateData);
      return response.data.data.comment;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  },

  async deleteComment(commentId) {
    try {
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }
};