import axios from "axios";
import { getApiBase } from "../utils/apiBase";

const baseURL = getApiBase();

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export function persistAuthTokens(data) {
  try {
    if (data?.token) localStorage.setItem("token", data.token);
    if (data?.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
  } catch {
    /* ignore storage errors */
  }
}

export function clearAuthTokens() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  } catch {
    /* ignore */
  }
}

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    const refresh = localStorage.getItem("refreshToken");
    config.headers = config.headers || {};
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (refresh && /\/api\/auth\/(checkAuth|refresh)/.test(config.url || "")) {
      config.headers["x-refresh-token"] = refresh;
    }
  } catch {
    /* storage unavailable */
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (res) => {
    if (res?.data?.token || res?.data?.refreshToken) {
      persistAuthTokens(res.data);
    }
    return res;
  },
  async (err) => {
    const original = err?.config;
    const status = err?.response?.status;
    const url = original?.url || "";

    if (
      status === 401 &&
      original &&
      !original._retried &&
      !/\/api\/auth\/(signin|signup|signinWithGoogle|signout|refresh|checkAuth)/.test(url)
    ) {
      original._retried = true;
      try {
        if (!refreshPromise) {
          const refreshToken = localStorage.getItem("refreshToken") || "";
          refreshPromise = axios
            .post(
              `${baseURL || ""}/api/auth/refresh`,
              { refreshToken },
              {
                withCredentials: true,
                headers: refreshToken ? { "x-refresh-token": refreshToken } : {},
              },
            )
            .then((r) => {
              persistAuthTokens(r.data);
              return r.data?.token || null;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const nextToken = await refreshPromise;
        if (nextToken) {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${nextToken}`;
          return api(original);
        }
      } catch {
        clearAuthTokens();
      }
    }
    return Promise.reject(err);
  },
);

export default api;
