import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const notificationsAPI = {
  // Chat APIs
  newChat: (data) => api.post('/notifications/chat', data),
  getChats: () => api.get('/notifications/chats'),
  getChat: (sessionId) => api.get(`/notifications/chat/${sessionId}`),
  acceptChat: (sessionId, employeeName) => api.patch(`/notifications/chat/${sessionId}/accept`, { employeeName }),
  endChat: (sessionId, endedBy) => api.patch(`/notifications/chat/${sessionId}/end`, { endedBy }),
  sendMessage: (sessionId, data) => api.post(`/notifications/chat/${sessionId}/message`, data),
  markMessagesRead: (sessionId, sender) => api.patch(`/notifications/chat/${sessionId}/read`, { sender }),
  deleteChat: (sessionId) => api.delete(`/notifications/chat/${sessionId}`),
  chatSummary: (data) => api.post('/notifications/chat-summary', data),
  
  // Question APIs
  newQuestion: (data) => api.post('/notifications/question', data),
  getQuestions: () => api.get('/notifications/questions'),
  markQuestionRead: (id, read) => api.patch(`/notifications/questions/${id}/read`, { read }),
  deleteQuestion: (id) => api.delete(`/notifications/questions/${id}`)
};

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  checkUsername: (username) => api.post('/auth/check-username', { username }),
  getMe: () => api.get('/auth/me'),
  updateDetails: (userData) => api.put('/auth/updatedetails', userData),
  updatePassword: (passwords) => api.put('/auth/updatepassword', passwords),
  verifyEmployeeCode: (code) => api.post('/auth/verify-employee-code', { code }),
  getPendingEmployees: () => api.get('/auth/pending-employees'),
  approveEmployee: (id) => api.put(`/auth/approve-employee/${id}`),
  rejectEmployee: (id) => api.delete(`/auth/reject-employee/${id}`)
};

// Service Requests API
export const serviceRequestAPI = {
  getAll: (params) => api.get('/service-requests', { params }),
  getById: (id) => api.get(`/service-requests/${id}`),
  create: (data) => api.post('/service-requests', data),
  update: (id, data) => api.put(`/service-requests/${id}`, data),
  delete: (id) => api.delete(`/service-requests/${id}`)
};

// Contact Forms API
export const contactFormAPI = {
  getAll: (params) => api.get('/contact-forms', { params }),
  getById: (id) => api.get(`/contact-forms/${id}`),
  create: (data) => api.post('/contact-forms', data),
  update: (id, data) => api.put(`/contact-forms/${id}`, data),
  delete: (id) => api.delete(`/contact-forms/${id}`)
};

// Price Estimates API
export const priceEstimateAPI = {
  getAll: (params) => api.get('/price-estimate', { params }),
  getSheetData: () => api.get('/price-estimate/sheets'), // Get data from Google Sheets
  getById: (id) => api.get(`/price-estimate/${id}`),
  update: (id, data) => api.put(`/price-estimate/${id}`, data),
  updateStatus: (id, status) => api.patch(`/price-estimate/${id}/status`, { status }),
  delete: (id) => api.delete(`/price-estimate/${id}`)
};

export default api;
