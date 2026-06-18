import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    getRegisterToken: () => api.post('/auth/get-register-token'),
    register: (registerToken, data) =>
        api.post('/auth/register', data, { headers: { 'x-register-token': registerToken } }),
    login: (data) => api.post('/auth/login', data),
    me: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
    changePassword: (data) => api.post('/auth/change-password', data),
    updateProfile: (data) => api.put('/auth/me', data)
};

export const leaveApi = {
    apply: (data) => api.post('/leaves/apply', data),
    myLeaves: () => api.get('/leaves/my'),
    allLeaves: () => api.get('/leaves/all'),
    updateStatus: (id, data) => api.put(`/leaves/${id}/status`, data),
    bcBalance: (finId, asOfDate) => api.get('/leaves/bc-balance', { params: { finId, asOfDate } }),
    getOne: (id) => api.get(`/leaves/${id}`),
    update: (id, data) => api.put(`/leaves/${id}`, data),
    updateStatusByRef: (refNumber, data) => api.patch(`/leaves/by-ref/${refNumber}/status`, data)
};

export const loanApi = {
    apply: (data) => api.post('/loans/apply', data),
    myLoans: () => api.get('/loans/my'),
    allLoans: () => api.get('/loans/all'),
    updateStatus: (id, data) => api.put(`/loans/${id}/status`, data)
};

export const assetApi = {
    apply: (data) => api.post('/assets/apply', data),
    myAssets: () => api.get('/assets/my'),
    allAssets: () => api.get('/assets/all'),
    updateStatus: (id, data) => api.put(`/assets/${id}/status`, data)
};

export const overtimeApi = {
    apply: (data) => api.post('/overtimes/apply', data),
    myOvertimes: () => api.get('/overtimes/my'),
    allOvertimes: () => api.get('/overtimes/all'),
    updateStatus: (id, data) => api.put(`/overtimes/${id}/status`, data)
};

export const travelApi = {
    apply: (data) => api.post('/travels/apply', data),
    myTravels: () => api.get('/travels/my'),
    allTravels: () => api.get('/travels/all'),
    updateStatus: (id, data) => api.put(`/travels/${id}/status`, data)
};

export const expenseApi = {
    apply: (data) => api.post('/expenses/apply', data),
    myExpenses: (type) => api.get('/expenses/my', { params: type ? { type } : {} }),
    allExpenses: () => api.get('/expenses/all'),
    updateStatus: (id, data) => api.put(`/expenses/${id}/status`, data)
};

export const employeeInfoApi = {
    getMy: () => api.get('/employee-info/my'),
    save: (data) => api.post('/employee-info/my', data),
    getAll: () => api.get('/employee-info/all')
};

export const holidayApi = {
    list: (year) => api.get('/holidays', { params: year ? { year } : {} })
};

export const dataMgmtApi = {
    tables: () => api.get('/data-management/tables'),
    deleteOne: (key) => api.delete(`/data-management/tables/${key}`),
    deleteSelected: (keys) => api.post('/data-management/delete-selected', { keys }),
    deleteAll: () => api.delete('/data-management/all')
};

export const finElementApi = {
    list: (params) => api.get('/fin-elements', { params }),
    getOne: (id) => api.get(`/fin-elements/${id}`),
    create: (data) => api.post('/fin-elements', data),
    update: (id, data) => api.put(`/fin-elements/${id}`, data),
    remove: (id) => api.delete(`/fin-elements/${id}`),
    scanFromBc: () => api.post('/fin-elements/scan-from-bc')
};

export const imageApi = {
    upload: (base64, opts = {}) =>
        api.post('/images/upload', { base64, filename: opts.filename, purpose: opts.purpose || 'profile' }),
    me: () => api.get('/images/me'),
    list: () => api.get('/images'),
    remove: (id) => api.delete(`/images/${id}`),
    urlFor: (id) => `${API_BASE_URL}/images/${id}`
};

export const adminApi = {
    stats: () => api.get('/users/admin/stats'),
    users: () => api.get('/users'),
    employees: () => api.get('/employee-info/all'),
    leaves: () => api.get('/leaves/all'),
    loans: () => api.get('/loans/all'),
    assets: () => api.get('/assets/all'),
    overtimes: () => api.get('/overtimes/all'),
    travels: () => api.get('/travels/all'),
    expenses: () => api.get('/expenses/all'),
    finElements: () => api.get('/fin-elements')
};

export default api;
