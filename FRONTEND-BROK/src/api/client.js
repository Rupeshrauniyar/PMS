import axios from "axios";
import { getApiBase } from "../utils/apiBase";

const baseURL = getApiBase();

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export const UNAUTHORIZED_EVENT = "broker:unauthorized";

export function persistBrokerTokens(data) {
  try {
    if (data?.token) localStorage.setItem("broker_token", data.token);
    if (data?.refreshToken) {
      localStorage.setItem("broker_refresh_token", data.refreshToken);
    }
  } catch {
    /* ignore */
  }
}

export function clearBrokerTokens() {
  try {
    localStorage.removeItem("broker_token");
    localStorage.removeItem("broker_refresh_token");
  } catch {
    /* ignore */
  }
}

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("broker_token");
    const refresh = localStorage.getItem("broker_refresh_token");
    config.headers = config.headers || {};
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (refresh && /\/api\/broker\/auth\/(checkAuth|refresh)/.test(config.url || "")) {
      config.headers["x-refresh-token"] = refresh;
    }
  } catch {
    /* ignore */
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (res) => {
    if (res?.data?.token || res?.data?.refreshToken) {
      persistBrokerTokens(res.data);
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
      !/\/auth\/(checkAuth|signin|signup|signinWithGoogle|signout|refresh)/.test(url)
    ) {
      original._retried = true;
      try {
        if (!refreshPromise) {
          const refreshToken = localStorage.getItem("broker_refresh_token") || "";
          refreshPromise = axios
            .post(
              `${baseURL || ""}/api/broker/auth/refresh`,
              { refreshToken },
              {
                withCredentials: true,
                headers: refreshToken ? { "x-refresh-token": refreshToken } : {},
              },
            )
            .then((r) => {
              persistBrokerTokens(r.data);
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
        clearBrokerTokens();
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      }
    } else if (
      status === 401 &&
      !/\/auth\/(checkAuth|signin|signup|signinWithGoogle|signout|refresh)/.test(url)
    ) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    return Promise.reject(err);
  },
);

export default api;
