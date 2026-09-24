
import axios from 'axios';

const API = axios.create({
  baseURL: 'https://mudzisavebackend.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-inject JWT token or fallback mock token for hackathon testing
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || 'mock-auth-token-12345';
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;