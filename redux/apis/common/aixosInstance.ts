import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";


const API_URL = "http://10.50.216.142:5000/api";

let isRefreshing = false;
let subscribers: ((token: string) => void)[] = [];

// Injected logout handler (Redux)
let logoutHandler: (() => void) | null = null;
export const injectLogoutHandler = (handler: () => void) => {
  logoutHandler = handler;
};

// Notify all queued requests after refresh
const notifySubscribers = (token: string) => {
  subscribers.forEach((cb) => cb(token));
  subscribers = [];
};

// Queue requests while refreshing
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  subscribers.push(callback);
};

// Axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to requests
axiosInstance.interceptors.request.use(async (config) => {
  const accessToken = await AsyncStorage.getItem("accessToken");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Handle responses
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as any;

    const status = error.response?.status;
    const errorMessage = error.response?.data?.error;

    // 🔐 Access token expired → refresh
    if (errorMessage === "Token expired" && !originalRequest._retry) {
      originalRequest._retry = true;

      // If refresh already in progress, wait
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("Missing refresh token");

        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = data.accessToken;

        // Store & apply new token
        await AsyncStorage.setItem("accessToken", newAccessToken);
        axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;

        notifySubscribers(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // 🔥 Refresh failed → logout
        if (logoutHandler) logoutHandler();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Any other 401 → logout
    // if (status === 401 && logoutHandler) {
    //   logoutHandler();
    // }

    return Promise.reject(error);
  }
);

export default axiosInstance;
