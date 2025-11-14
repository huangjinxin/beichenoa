import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
};

export const studentApi = {
  getAll: (params?: any) => api.get('/students', { params }),
  getOne: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.put(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
};

export const classApi = {
  getAll: () => api.get('/classes'),
  getOne: (id: string) => api.get(`/classes/${id}`),
  create: (data: any) => api.post('/classes', data),
  update: (id: string, data: any) => api.put(`/classes/${id}`, data),
  delete: (id: string) => api.delete(`/classes/${id}`),
};

export const growthRecordApi = {
  getAll: (params?: any) => api.get('/growth-records', { params }),
  getTimeline: (studentId: string) => api.get(`/growth-records/timeline/${studentId}`),
  create: (data: any) => api.post('/growth-records', data),
  update: (id: string, data: any) => api.put(`/growth-records/${id}`, data),
  delete: (id: string) => api.delete(`/growth-records/${id}`),
};

export const ingredientApi = {
  getAll: (params?: any) => api.get('/canteen/ingredients', { params }),
  getOne: (id: string) => api.get(`/canteen/ingredients/${id}`),
  create: (data: any) => api.post('/canteen/ingredients', data),
  update: (id: string, data: any) => api.put(`/canteen/ingredients/${id}`, data),
  delete: (id: string) => api.delete(`/canteen/ingredients/${id}`),
};

export const dishApi = {
  getAll: (params?: any) => api.get('/canteen/dishes', { params }),
  getOne: (id: string) => api.get(`/canteen/dishes/${id}`),
  create: (data: any) => api.post('/canteen/dishes', data),
  update: (id: string, data: any) => api.put(`/canteen/dishes/${id}`, data),
  delete: (id: string) => api.delete(`/canteen/dishes/${id}`),
};

export const menuApi = {
  getByDate: (date: string) => api.get('/canteen/menus', { params: { date } }),
  getNutrition: (id: string) => api.get(`/canteen/menus/${id}/nutrition`),
  create: (data: any) => api.post('/canteen/menus', data),
  update: (id: string, data: any) => api.put(`/canteen/menus/${id}`, data),
  delete: (id: string) => api.delete(`/canteen/menus/${id}`),
};

export const formApi = {
  getTemplates: () => api.get('/forms/templates'),
  getTemplate: (id: string) => api.get(`/forms/templates/${id}`),
  createTemplate: (data: any) => api.post('/forms/templates', data),
  getSubmissions: (params?: any) => api.get('/forms/submissions', { params }),
  createSubmission: (data: any) => api.post('/forms/submissions', data),
  updateSubmission: (id: string, data: any) => api.put(`/forms/submissions/${id}`, data),
};

export const reportApi = {
  getOverview: () => api.get('/reports/overview'),
  getStudentStats: (params?: any) => api.get('/reports/students', { params }),
};

export default api;
