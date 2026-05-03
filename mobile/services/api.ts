import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Render Backend URL (loaded from .env)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://smart-hostel-mobile.onrender.com/api'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('user_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors (e.g., token expiration)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., redirect to login)
      await SecureStore.deleteItemAsync('user_token');
    }
    return Promise.reject(error);
  }
);

export default api;
