import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for auth token
api.interceptors.request.use(
    (config) => {
        // Add any auth headers if needed
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized - redirect to login
            if (typeof window !== 'undefined') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    getMe: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
};

// Emails API
export const emailsApi = {
    getScheduled: (page = 1, limit = 20) =>
        api.get(`/emails/scheduled?page=${page}&limit=${limit}`),
    getSent: (page = 1, limit = 20) =>
        api.get(`/emails/sent?page=${page}&limit=${limit}`),
    schedule: (data: {
        senderId: string;
        toEmail: string;
        subject: string;
        body: string;
        scheduledAt: string;
    }) => api.post('/emails/schedule', data),
    scheduleBulk: (data: {
        senderId: string;
        emails: string[];
        subject: string;
        body: string;
        startTime: string;
        delayBetweenEmails: number;
    }) => api.post('/emails/schedule/bulk', data),
    cancel: (id: string) => api.delete(`/emails/${id}`),
    getById: (id: string) => api.get(`/emails/${id}`),
};

// Senders API
export const sendersApi = {
    getAll: () => api.get('/senders'),
    create: (name: string) => api.post('/senders', { name }),
    getById: (id: string) => api.get(`/senders/${id}`),
    update: (id: string, data: { name?: string; hourlyLimit?: number }) =>
        api.patch(`/senders/${id}`, data),
    delete: (id: string) => api.delete(`/senders/${id}`),
};

// Health API
export const healthApi = {
    check: () => api.get('/health'),
    stats: () => api.get('/stats'),
};

export default api;
