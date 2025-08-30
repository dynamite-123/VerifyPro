import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Create an axios instance with default config
// Note: don't set a global 'Content-Type' header here because some
// requests use FormData and require the browser to set the multipart
// boundary automatically.
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
});

// Auth related API calls
export const authService = {
  register: async (userData: any) => {
  const response = await api.post('/auth/register', userData);
  return response;
  },
  
  login: async (credentials: any) => {
  const response = await api.post('/auth/login', credentials);
  return response;
  },
  
  logout: async () => {
  const response = await api.post('/auth/logout');
  return response;
  },
  
  getCurrentUser: async () => {
  const response = await api.get('/auth/current-user');
  return response;
  },
  
  refreshToken: async () => {
  const response = await api.post('/auth/refresh-token');
  return response;
  }
};

// OTP related API calls
export const otpService = {
  sendOtp: async (email: string) => {
    const response = await api.post('/auth/send-otp', { email });
    return response;
  },

  verifyOtpImage: async (email: string, imageFile: File) => {
    // Convert File to base64 string and send as JSON (avoid multipart)
    const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    const imageBase64 = await toBase64(imageFile);
    const payload = { email, imageBase64 };
    const response = await api.post('/auth/verify-otp-image', payload);
    return response;
  }
};

// Add request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Try to get token from cookies first (preferred for security)
    // If not available in cookies (which is what the server sets), try localStorage as fallback
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshResponse = await authService.refreshToken();
        // If refresh successful, update token
        if (refreshResponse.data && refreshResponse.data.accessToken) {
          localStorage.setItem('accessToken', refreshResponse.data.accessToken);
        }
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear token and redirect to login
        localStorage.removeItem('accessToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
