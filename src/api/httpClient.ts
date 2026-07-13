import axios, { type InternalAxiosRequestConfig, AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5122',
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

httpClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = 'Bearer ' + token;
            }
            return httpClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { accessToken, refreshToken, logout, setTokens } = useAuthStore.getState();

      if (!refreshToken || !accessToken) {
        processQueue(new Error('No refresh token available'));
        isRefreshing = false;
        logout();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${httpClient.defaults.baseURL}/api/auth/refresh-token`, {
          accessToken,
          refreshToken,
        });

        const data = response.data;
        if (data.success && data.data) {
          const newTokens = data.data;
          setTokens(newTokens.accessToken, newTokens.refreshToken);
          processQueue(null, newTokens.accessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          }
          return httpClient(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Global error toasts
    if (error.response) {
      const status = error.response.status;
      if (status === 403) {
        toast.error('Bạn không có quyền thực hiện thao tác này');
      } else if (status === 404) {
        toast.error('Không tìm thấy dữ liệu');
      } else if (status === 409) {
        toast.error('Dữ liệu đã thay đổi, vui lòng tải lại');
      }
      // 400 is usually handled by the specific component mutation onError for detailed messages
    } else {
      toast.error('Không thể kết nối đến máy chủ');
    }

    return Promise.reject(error);
  }
);

export default httpClient;
