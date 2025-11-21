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

// 公共API（无需认证）
const publicApi = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

publicApi.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export const authApi = {
  login: (identifier: string, password: string) => api.post('/auth/login', { identifier, password }),
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
  // 表单分享
  generateShareLink: (templateId: string) => api.post(`/forms/templates/${templateId}/share`),
  getTemplateByShareToken: (token: string) => publicApi.get(`/forms/share/${token}`),
  submitByShareToken: (token: string, data: any) => publicApi.post(`/forms/share/${token}/submit`, data),
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

  // 数据联动 API
  searchEntities: (params: { entityType: string; keyword?: string; filters?: any }) =>
    api.get('/forms/entities/search', { params: { ...params, filters: params.filters ? JSON.stringify(params.filters) : undefined } }),
  searchStudents: (params?: { keyword?: string; classId?: string }) =>
    api.get('/forms/entities/students', { params }),
  searchTeachers: (params?: { keyword?: string }) =>
    api.get('/forms/entities/teachers', { params }),
  searchClasses: (params?: { keyword?: string }) =>
    api.get('/forms/entities/classes', { params }),
  validateUnique: (data: { entityType: string; field: string; value: string; excludeId?: string }) =>
    api.post('/forms/validate/unique', data),
  validateBatch: (data: { templateId: string; data: any[] }) =>
    api.post('/forms/validate/batch', data),
  // 实体绑定配置
  getEntityBindings: (templateId: string) => api.get(`/forms/templates/${templateId}/entity-bindings`),
  createEntityBinding: (templateId: string, data: any) => api.post(`/forms/templates/${templateId}/entity-bindings`, data),
  updateEntityBinding: (id: string, data: any) => api.put(`/forms/entity-bindings/${id}`, data),
  deleteEntityBinding: (id: string) => api.delete(`/forms/entity-bindings/${id}`),
  // 数据同步
  syncEntities: (submissionId: string) => api.post(`/forms/submissions/${submissionId}/sync-entities`),
  processFieldModes: (submissionId: string) => api.post(`/forms/submissions/${submissionId}/process-fields`),
  getEntityLinks: (submissionId: string) => api.get(`/forms/submissions/${submissionId}/entity-links`),
};

// 审批流程设计器 API
export const approvalApi = {
  // 流程管理
  getFlows: (params?: any) => api.get('/approvals/flows', { params }),
  getFlow: (id: string) => api.get(`/approvals/flows/${id}`),
  getFlowsByTemplate: (templateId: string) => api.get(`/approvals/flows/template/${templateId}`),
  createFlow: (data: any) => api.post('/approvals/flows', data),
  updateFlow: (id: string, data: any) => api.put(`/approvals/flows/${id}`, data),
  deleteFlow: (id: string) => api.delete(`/approvals/flows/${id}`),

  // 节点管理
  addNode: (flowId: string, data: any) => api.post(`/approvals/flows/${flowId}/nodes`, data),
  updateNode: (nodeId: string, data: any) => api.put(`/approvals/nodes/${nodeId}`, data),
  deleteNode: (nodeId: string) => api.delete(`/approvals/nodes/${nodeId}`),
  reorderNodes: (flowId: string, nodeIds: string[]) =>
    api.put(`/approvals/flows/${flowId}/nodes/reorder`, { nodeIds }),

  // 流程绑定
  bindFlowToTemplate: (flowId: string, templateId: string) =>
    api.post(`/approvals/flows/${flowId}/bind/${templateId}`),
  unbindFlowFromTemplate: (flowId: string) =>
    api.delete(`/approvals/flows/${flowId}/unbind`),

  // 审批人选项
  getApproverOptions: (params?: any) => api.get('/approvals/approvers', { params }),
  getRoleOptions: () => api.get('/approvals/roles'),
  getPositionOptions: () => api.get('/approvals/positions'),
  getUsersByRole: (role: string) => api.get(`/approvals/users/by-role/${role}`),
  getUsersByPosition: (positionId: string) => api.get(`/approvals/users/by-position/${positionId}`),
  getSuperior: (userId: string) => api.get(`/approvals/users/superior/${userId}`),

  // 审批任务管理
  getMyPendingTasks: () => api.get('/approvals/tasks/pending'),
  getMyCompletedTasks: () => api.get('/approvals/tasks/completed'),
  processTask: (taskId: string, data: { action: 'APPROVE' | 'REJECT' | 'RETURN'; comment?: string }) =>
    api.post(`/approvals/tasks/${taskId}/process`, data),
  startApprovalFlow: (submissionId: string, flowId: string) =>
    api.post(`/approvals/submissions/${submissionId}/start`, { flowId }),
  getApprovalHistory: (submissionId: string) =>
    api.get(`/approvals/submissions/${submissionId}/history`),
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
  // 审核相关
  getPending: () => api.get('/users/pending/list'),
  getStatistics: () => api.get('/users/statistics/summary'),
  approve: (id: string, data: { role: string; campusId: string; adminId: string; note?: string }) =>
    api.post(`/users/${id}/approve`, data),
  reject: (id: string, data: { adminId: string; note: string }) =>
    api.post(`/users/${id}/reject`, data),
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

// 考勤记录 API
export const attendanceApi = {
  createRecord: (data: any) => api.post('/attendance/record', data),
  getByClassAndDate: (classId: string, date: string) => api.get(`/attendance/class/${classId}/date/${date}`),
  getRecords: (params?: any) => api.get('/attendance/records', { params }),
  getStudentHistory: (studentId: string, params?: any) => api.get(`/attendance/student/${studentId}/history`, { params }),
  updateAttendance: (id: string, data: { status: string; note?: string }) => api.patch(`/attendance/${id}`, data),
};

// 公告 API
export const announcementApi = {
  getAll: (params?: any) => api.get('/announcements', { params }),
  getMy: () => api.get('/announcements/my'),
  getOne: (id: string) => api.get(`/announcements/${id}`),
  create: (data: any) => api.post('/announcements', data),
  update: (id: string, data: any) => api.patch(`/announcements/${id}`, data),
  delete: (id: string) => api.delete(`/announcements/${id}`),
};

export default api;
