import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth Services
export const authService = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// User Services
export const userService = {
  getAllUsers: () => api.get('/auth/users/all')
};

// Development helper to promote a user to Admin (requires ADMIN_SECRET)
export const adminService = {
  seedAdmin: (data) => api.post('/auth/seed-admin', data)
};

// Team Services
export const teamService = {
  create: (data) => api.post('/teams', data),
  getAll: () => api.get('/teams'),
  getById: (id) => api.get(`/teams/${id}`),
  update: (id, data) => api.put(`/teams/${id}`, data),
  addMember: (id, data) => api.post(`/teams/${id}/members`, data)
};

// Member management (toggle role / remove)
teamService.toggleMemberRole = (teamId, memberId) => api.put(`/teams/${teamId}/members/${memberId}/role`);
teamService.removeMember = (teamId, memberId) => api.delete(`/teams/${teamId}/members/${memberId}`);

// Project Services
export const projectService = {
  create: (teamId, data) => api.post(`/teams/${teamId}/projects`, data),
  getAll: (teamId) => api.get(`/teams/${teamId}/projects`),
  getById: (projectId) => api.get(`/projects/${projectId}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`)
};

// Task Services
export const taskService = {
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  getAll: (projectId) => api.get(`/projects/${projectId}/tasks`),
  getById: (taskId) => api.get(`/tasks/${taskId}`),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  addComment: (id, data) => api.post(`/tasks/${id}/comments`, data)
};

export default api;
