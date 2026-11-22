import axios from "axios";
import { getApiBase } from "../utils/apiBase";

/** Axios: HttpOnly cookies + optional Bearer token fallback if stored. */
const baseURL = getApiBase();
if (!import.meta.env.DEV && !baseURL) {
  console.warn(
    "[api] VITE_backendUrl is not set — build will call relative URLs on the SPA host.",
  );
}

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    /* storage unavailable */
  }
  return config;
});

export default api;
