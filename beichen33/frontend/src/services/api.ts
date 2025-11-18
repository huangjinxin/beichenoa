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
  getStats: (classIds?: string[]) => api.get('/students/stats', { params: { classIds: classIds?.join(',') } }),
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

export const nutritionApi = {
  analyze: (params: { startDate: string; endDate: string; classId?: string }) =>
    api.get('/canteen/nutrition/analyze', { params }),
  weeklyReport: (params: { startDate: string; endDate: string; classId?: string }) =>
    api.get('/canteen/nutrition/weekly-report', { params }),
  // 营养标准管理
  getStandards: () => api.get('/canteen/nutrition/standards'),
  getRecommendedStandards: () => api.get('/canteen/nutrition/standards/recommended'),
  upsertStandard: (data: any) => api.post('/canteen/nutrition/standards', data),
  applyRecommendedStandards: () => api.post('/canteen/nutrition/standards/apply-recommended'),
};

export const formApi = {
  // 模板管理
  getTemplates: (params?: any) => api.get('/forms/templates', { params }),
  getTemplate: (id: string) => api.get(`/forms/templates/${id}`),
  createTemplate: (data: any) => api.post('/forms/templates', data),
  updateTemplate: (id: string, data: any) => api.put(`/forms/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/forms/templates/${id}`),
  // 预置模板
  getPresetTemplates: () => api.get('/forms/templates/presets'),
  createFromPreset: (data: { presetId: string; title?: string }) => api.post('/forms/templates/from-preset', data),
  initPresetTemplates: () => api.post('/forms/templates/init-presets'),
  // 表单提交
  getSubmissions: (params?: any) => api.get('/forms/submissions', { params }),
  getSubmission: (id: string) => api.get(`/forms/submissions/${id}`),
  createSubmission: (data: any) => api.post('/forms/submissions', data),
  updateSubmission: (id: string, data: any) => api.put(`/forms/submissions/${id}`, data),
  // 审批
  approveSubmission: (id: string, data: { action: 'APPROVE' | 'REJECT' | 'RETURN'; comment?: string }) =>
    api.post(`/forms/submissions/${id}/approve`, data),
  // 我的审批列表
  getMyPendingApprovals: (params?: any) => api.get('/forms/approvals/pending', { params }),
  getMyApprovedList: (params?: any) => api.get('/forms/approvals/approved', { params }),
  // 实时计算
  calculateRow: (data: { row: any; columns: any[] }) => api.post('/forms/calculate/row', data),
};

export const reportApi = {
  getOverview: () => api.get('/reports/overview'),
  getStudentStats: (params?: any) => api.get('/reports/students', { params }),
};

export const userApi = {
  getAll: (params?: any) => api.get('/users', { params }),
  getOne: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const campusApi = {
  getAll: () => api.get('/campus'),
  getOne: (id: string) => api.get(`/campus/${id}`),
  create: (data: any) => api.post('/campus', data),
  update: (id: string, data: any) => api.put(`/campus/${id}`, data),
  delete: (id: string) => api.delete(`/campus/${id}`),
};

export const positionApi = {
  getAll: () => api.get('/positions'),
  getHierarchy: () => api.get('/positions/hierarchy'),
  getOne: (id: string) => api.get(`/positions/${id}`),
  create: (data: any) => api.post('/positions', data),
  update: (id: string, data: any) => api.put(`/positions/${id}`, data),
  delete: (id: string) => api.delete(`/positions/${id}`),
};

export const purchaseApi = {
  generate: (data: any) => api.post('/canteen/purchase/generate', data),
  getPlans: (params?: any) => api.get('/canteen/purchase/plans', { params }),
  getPlan: (id: string) => api.get(`/canteen/purchase/plans/${id}`),
  confirmPlan: (id: string) => api.post(`/canteen/purchase/plans/${id}/confirm`),
  orderPlan: (id: string) => api.post(`/canteen/purchase/plans/${id}/order`),
  completePlan: (id: string) => api.post(`/canteen/purchase/plans/${id}/complete`),
  deletePlan: (id: string) => api.delete(`/canteen/purchase/plans/${id}`),
};

export const supplierApi = {
  getAll: (params?: any) => api.get('/canteen/suppliers', { params }),
  getCategories: () => api.get('/canteen/suppliers/categories'),
  getOne: (id: string) => api.get(`/canteen/suppliers/${id}`),
  create: (data: any) => api.post('/canteen/suppliers', data),
  update: (id: string, data: any) => api.put(`/canteen/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/canteen/suppliers/${id}`),
};

export const dailyObservationApi = {
  getAll: (params?: any) => api.get('/records/daily-observation', { params }),
  getOne: (id: string) => api.get(`/records/daily-observation/${id}`),
  create: (data: any) => api.post('/records/daily-observation', data),
  update: (id: string, data: any) => api.put(`/records/daily-observation/${id}`, data),
  delete: (id: string) => api.delete(`/records/daily-observation/${id}`),
};

export const dutyReportApi = {
  getAll: (params?: any) => api.get('/records/duty-report', { params }),
  getOne: (id: string) => api.get(`/records/duty-report/${id}`),
  create: (data: any) => api.post('/records/duty-report', data),
  update: (id: string, data: any) => api.put(`/records/duty-report/${id}`, data),
  delete: (id: string) => api.delete(`/records/duty-report/${id}`),
};

export default api;
