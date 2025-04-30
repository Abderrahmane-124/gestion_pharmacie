// src/services/api.ts
import axios from 'axios';

const API_URL = 'http://localhost:8080'; 

// Function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp) {
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expirationTime;
    }
    return false;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true; // Assume token is expired if there's an error
  }
};

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Request interceptor for adding the auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !isTokenExpired(token)) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else if (token && isTokenExpired(token)) {
      // Clean up expired token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if needed
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors (unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear auth data if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  register: (userData: {
    nom: string;
    prenom: string;
    email: string;
    motDePasse: string;
    ville: string;
    adresse: string;
    role: string;
    telephone?: string;
  }) => {
    return apiClient.post('/auth/register', userData);
  },
  
  login: (credentials: { email: string; motDePasse: string }) => {
    return apiClient.post('/auth/login', credentials);
  },
  
  // Updated to use the specific current user endpoint
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/api/utilisateurs/current');
      return response.data;
    } catch (error) {
      console.error("Error getting current user:", error);
      throw error;
    }
  }
};

export default apiClient;