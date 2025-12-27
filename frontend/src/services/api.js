import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const getMe = () => api.get('/auth/me');

// Users
export const getUsers = () => api.get('/users');
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.patch(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Projects
export const getProjects = () => api.get('/projects');
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (id, data) => api.patch(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

// Materials
export const getMaterials = () => api.get('/materials');
export const getCategories = () => api.get('/materials/categories');
export const createMaterial = (data) => api.post('/materials', data);
export const updateMaterial = (id, data) => api.patch(`/materials/${id}`, data);
export const deleteMaterial = (id) => api.delete(`/materials/${id}`);

// Suppliers
export const getSuppliers = () => api.get('/suppliers');
export const getSupplier = (id) => api.get(`/suppliers/${id}`);
export const createSupplier = (data) => api.post('/suppliers', data);
export const updateSupplier = (id, data) => api.patch(`/suppliers/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`);

// Requests
export const getRequests = () => api.get('/requests');
export const getRequest = (id) => api.get(`/requests/${id}`);
export const createRequest = (data) => api.post('/requests', data);
export const updateRequestStatus = (id, status) => api.patch(`/requests/${id}/status`, { status });
export const approveRequest = (id, data) => api.post(`/requests/${id}/approve`, data);

// RFQ
export const getRFQs = () => api.get('/rfq');
export const getRFQ = (id) => api.get(`/rfq/${id}`);
export const createRFQ = (data) => api.post('/rfq', data);
export const checkStockForRFQ = (data) => api.post('/rfq/check-stock', data);

// Quotations
export const getQuotations = () => api.get('/quotations');
export const getQuotationsByRFQ = (rfqId) => api.get(`/quotations/rfq/${rfqId}`);
export const createQuotation = (data) => api.post('/quotations', data);
export const selectQuotation = (id) => api.post(`/quotations/${id}/select`);

// Purchase Orders
export const getPOs = () => api.get('/po');
export const createPO = (data) => api.post('/po', data);
export const approvePO = (id, data) => api.post(`/po/${id}/approve`, data);
export const updatePOStatus = (id, status) => api.patch(`/po/${id}/status`, { status });

// Delivery
export const createDelivery = (data) => api.post('/delivery', data);
export const getDeliveryByPO = (poId) => api.get(`/delivery/po/${poId}`);

// Payment
export const createPayment = (data) => api.post('/payment', data);
export const approvePayment = (id, data) => api.post(`/payment/${id}/approve`, data);
export const getPaymentByPO = (poId) => api.get(`/payment/po/${poId}`);
export const checkPaymentDocuments = (data) => api.post('/payment/check-documents', data);

// Evaluation
export const createEvaluation = (data) => api.post('/evaluation', data);
export const getEvaluationsBySupplier = (supplierId) => api.get(`/evaluation/supplier/${supplierId}`);

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getSpendingByProject = () => api.get('/dashboard/spending-by-project');
export const getSpendingByCategory = () => api.get('/dashboard/spending-by-category');
export const getTopSuppliers = () => api.get('/dashboard/top-suppliers');
export const getPOStatus = () => api.get('/dashboard/po-status');

// Notifications
export const getNotifications = () => api.get('/notifications');
export const markAsRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllAsRead = () => api.patch('/notifications/read-all');

// Quotas
export const getQuotas = () => api.get('/quotas');
export const getQuotasByProject = (projectId) => api.get(`/quotas/project/${projectId}`);
export const createOrUpdateQuota = (data) => api.post('/quotas', data);
export const deleteQuota = (id) => api.delete(`/quotas/${id}`);
export const checkQuota = (data) => api.post('/quotas/check', data);

// Stock Issues
export const getStockIssues = () => api.get('/stock');
export const getStockIssueByRequest = (requestId) => api.get(`/stock/request/${requestId}`);
export const createStockIssue = (data) => api.post('/stock', data);
export const confirmReceiveStock = (id, data) => api.post(`/stock/${id}/receive`, data);
export const checkStock = (data) => api.post('/stock/check', data);

// Delivery Tracking
export const getTracking = (poId) => api.get(`/tracking/po/${poId}`);
export const createTracking = (data) => api.post('/tracking', data);
export const checkDelays = () => api.get('/tracking/check-delays');
