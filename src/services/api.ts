import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true // Crucial for sending HttpOnly Cookies across origins!
});

// Securely store Access Token in browser memory ONLY
let accessToken = '';

export const setAccessToken = (token: string) => {
  accessToken = token;
};

// Request interceptor to attach bearer token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for 401 Tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If we catch a 401 Unauthorized, and we haven't retried yet:
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to seamlessly refresh using our invisible HttpOnly cookie
        const refreshUrl = `${API_URL.replace(/\/$/, '')}/refresh.php`;
        const res = await axios.post(refreshUrl, {}, { withCredentials: true });
        if (res.data.status === 'success') {
          // Hydrate the memory
          setAccessToken(res.data.data.token);
          // Retry the original failed request!
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (err) {
        // If refresh fails (e.g., 7 days expired), force user to login page
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
