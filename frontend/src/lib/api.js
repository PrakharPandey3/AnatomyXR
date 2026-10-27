import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 7000
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || (error.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : 'Could not connect to AnatomyXR. Check that the backend is running.');
    return Promise.reject(new Error(message));
  }
);

export default api;
