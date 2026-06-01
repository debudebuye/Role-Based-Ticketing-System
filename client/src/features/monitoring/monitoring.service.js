import api from '../../shared/utils/api.js';

export const monitoringService = {
  async getHealth() {
    const res = await api.get('/monitoring/health');
    return res.data.data;
  },

  async getActiveUsers() {
    const res = await api.get('/monitoring/active-users');
    return res.data.data;
  },

  async getErrors(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, v);
    });
    const res = await api.get(`/monitoring/errors?${q}`);
    return res.data.data;
  },

  async resolveError(id) {
    const res = await api.patch(`/monitoring/errors/${id}/resolve`);
    return res.data.data.error;
  },

  async getAuditLog(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, v);
    });
    const res = await api.get(`/monitoring/audit-log?${q}`);
    return res.data.data;
  },

  async getStats() {
    const res = await api.get('/monitoring/stats');
    return res.data.data;
  },
};
