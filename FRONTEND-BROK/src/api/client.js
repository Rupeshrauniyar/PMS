import axios from "axios";
import { getApiBase } from "../utils/apiBase";

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

/**
 * Broadcast session expiry so the auth context can sign the broker out.
 * `checkAuth` / sign-in endpoints are excluded because a 401 there is an
 * expected answer, not an expired session.
 */
export const UNAUTHORIZED_EVENT = "broker:unauthorized";

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url || "";
    if (status === 401 && !/\/auth\/(checkAuth|signin|signup|signinWithGoogle|signout)/.test(url)) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(err);
  },
);

export default api;
