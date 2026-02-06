import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
    baseURL: `${API_URL}/api`,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses
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

// Dashboard
export const getDashboardSummary = () => api.get('/dashboard/summary');
export const getCashflow = (months = 6) => api.get(`/dashboard/cashflow?months=${months}`);
export const getDRE = () => api.get('/dashboard/dre');

// Categories
export const getCategories = (type) => api.get(`/categories${type ? `?type=${type}` : ''}`);
export const createCategory = (data) => api.post('/categories', data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Contacts
export const getContacts = (type) => api.get(`/contacts${type ? `?type=${type}` : ''}`);
export const createContact = (data) => api.post('/contacts', data);
export const deleteContact = (id) => api.delete(`/contacts/${id}`);

// Revenues
export const getRevenues = (params) => api.get('/revenues', { params });
export const createRevenue = (data) => api.post('/revenues', data);
export const updateRevenue = (id, data) => api.put(`/revenues/${id}`, data);
export const deleteRevenue = (id) => api.delete(`/revenues/${id}`);

// Expenses
export const getExpenses = (params) => api.get('/expenses', { params });
export const createExpense = (data) => api.post('/expenses', data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

// Activities
export const getActivities = (limit = 20) => api.get(`/activities?limit=${limit}`);

// Reports
export const getReportByCategory = (type) => api.get(`/reports/by-category?type=${type}`);
export const getReportByContact = (type) => api.get(`/reports/by-contact?type=${type}`);
export const getMonthlyReport = (year) => api.get(`/reports/monthly${year ? `?year=${year}` : ''}`);

// AI Analysis
export const getAIAnalysis = (analysisType, period) => api.post('/analysis/ai', { analysis_type: analysisType, period });

export default api;
