import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://hostel-001.onrender.com';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('hostel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response interceptor for Auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token if server says 401
      await AsyncStorage.removeItem('hostel_token');
      await AsyncStorage.removeItem('hostel_user');
      // Optional: You could trigger a global 'logout' event here
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (data: object) => apiClient.post('/auth/register', data),
  sendSignupOtp: (email: string) => apiClient.post('/auth/send-signup-otp', { email }),
  verifySignupOtp: (email: string, otp: string) => apiClient.post('/auth/verify-signup-otp', { email, otp }),
  forgotPassword: (data: object) => apiClient.post('/auth/forgot-password', data),
  resetPassword: (email: string, otp: string) => apiClient.post('/auth/reset-password', { email, otp }),
  getProfile: () => apiClient.get('/users/profile'),
};

// Stats
export const statsAPI = {
  getStats: () => apiClient.get('/stats'),
  getOverview: () => apiClient.get('/stats/overview'), 
  getStudentStats: () => apiClient.get('/stats/student'),
};

// Rooms
export const roomsAPI = {
  getRooms: (params = {}) => apiClient.get('/rooms', { params }),
  getRoom: (id: string) => apiClient.get(`/rooms/${id}`),
};

// Allocations
export const allocationsAPI = {
  getAllocations: (params = {}) => apiClient.get('/allocations', { params }),
};

// Notices
export const noticesAPI = {
  getNotices: () => apiClient.get('/notices'),
};

// Students / Applications
export const applicationsAPI = {
  getApplications: (params = {}) => apiClient.get('/applications', { params }),
  getMyApplication: () => apiClient.get('/applications/me'),
  getStudentStatus: () => apiClient.get('/student-payments/status'),
};

// Financial
export const financialAPI = {
  getRefundable: () => apiClient.get('/financial/refundable'),
  getClearances: () => apiClient.get('/clearance/warden'),
};

export default apiClient;
