import axios from "axios";
import { getApiBase } from "../utils/apiBase";

/** Axios: HttpOnly cookies. In dev, baseURL '' uses Vite proxy → same origin cookies. */
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

export default api;
