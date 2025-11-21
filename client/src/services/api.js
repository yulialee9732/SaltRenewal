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
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  updateDetails: (userData) => api.put('/auth/updatedetails', userData),
  updatePassword: (passwords) => api.put('/auth/updatepassword', passwords)
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

export default api;
