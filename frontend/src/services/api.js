import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('accessToken');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.message || err.message || 'Network error';
    // 401 without retry means the token is gone — AuthContext handles the refresh
    return Promise.reject(new Error(msg));
  }
);

// ── Customers ──────────────────────────────────────────────
export const customerAPI = {
  list:   (p)   => api.get('/customers', { params: p }),
  get:    (id)  => api.get(`/customers/${id}`),
  stats:  ()    => api.get('/customers/stats'),
  create: (d)   => api.post('/customers', d),
  update: (id,d)=> api.put(`/customers/${id}`, d),
  delete: (id)  => api.delete(`/customers/${id}`),
};

// ── Orders ─────────────────────────────────────────────────
export const orderAPI = {
  list:      (p)  => api.get('/orders', { params: p }),
  analytics: ()   => api.get('/orders/analytics'),
  create:    (d)  => api.post('/orders', d),
  delete:    (id) => api.delete(`/orders/${id}`),
};

// ── Segments ────────────────────────────────────────────────
export const segmentAPI = {
  list:    ()     => api.get('/segments'),
  get:     (id)   => api.get(`/segments/${id}`),
  preview: (d)    => api.post('/segments/preview', d),
  create:  (d)    => api.post('/segments', d),
  aiCreate:(d)    => api.post('/segments/ai', d),
  suggest: ()     => api.post('/segments/ai/suggest'),
  update:  (id,d) => api.put(`/segments/${id}`, d),
  delete:  (id)   => api.delete(`/segments/${id}`),
};

// ── Campaigns ───────────────────────────────────────────────
export const campaignAPI = {
  list:      (p)  => api.get('/campaigns', { params: p }),
  analytics: ()   => api.get('/campaigns/analytics'),
  get:       (id) => api.get(`/campaigns/${id}`),
  create:    (d)  => api.post('/campaigns', d),
  aiMessage: (d)  => api.post('/campaigns/ai/message', d),
  send:      (id) => api.post(`/campaigns/${id}/send`),
};

// ── AI Assistant ────────────────────────────────────────────
export const aiAPI = {
  chat: (d) => api.post('/ai/chat', d),
};

export default api;
