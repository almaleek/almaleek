import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

//  export const FINTECH_API_URL = "http://10.176.226.142:5000/api";
// export const MARKETPLACE_API_URL = "http://10.173.176.142:5001/api";
const FINTECH_API_URL = "https://just-nourishment-production-0a52.up.railway.app/api"
export const MARKETPLACE_API_URL = "https://almaleekmarketplace-production.up.railway.app/api"


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

const createAuthedAxiosInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
  });

  instance.interceptors.request.use(async (config) => {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (config.method === "post" || config.method === "put" || config.method === "patch") {
      const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      config.headers["X-Request-ID"] = requestId;
    }

    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as any;

      const status = error.response?.status;
      const errorMessage = error.response?.data?.error || error.response?.data?.msg;

      if (status === 401 && errorMessage === "Token expired" && !originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((token) => {
              if (!token) {
                return reject(new Error("Failed to refresh token"));
              }
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(instance(originalRequest));
            });
          });
        }

        isRefreshing = true;

        try {
          const refreshToken = await AsyncStorage.getItem("refreshToken");
          if (!refreshToken) throw new Error("Missing refresh token");

          const { data } = await axios.post(`${FINTECH_API_URL}/auth/refresh`, {
            refreshToken,
          });

          const newAccessToken = data.accessToken;

          await AsyncStorage.setItem("accessToken", newAccessToken);
          instance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;

          notifySubscribers(newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);

          await AsyncStorage.removeItem("accessToken");
          await AsyncStorage.removeItem("refreshToken");

          if (logoutHandler) logoutHandler();

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const axiosInstance = createAuthedAxiosInstance(FINTECH_API_URL);
export const marketplaceAxiosInstance = createAuthedAxiosInstance(MARKETPLACE_API_URL);

export default axiosInstance;
