import axios from "axios";

/** Human-readable message for an axios / generic error. */
export function getErrorMessage(err, fallback = "Something went wrong.") {
  if (!err) return fallback;
  const msg = err?.response?.data?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  if (err?.code === "ERR_NETWORK") return "You appear to be offline.";
  return fallback;
}

export const statusOf = (err) => err?.response?.status ?? 0;
export const isConflict = (err) => statusOf(err) === 409;
export const isUnauthorized = (err) => statusOf(err) === 401;
export const isForbidden = (err) => statusOf(err) === 403;
export const isNotFound = (err) => statusOf(err) === 404;
export const isAborted = (err) =>
  axios.isCancel(err) || err?.name === "CanceledError" || err?.name === "AbortError";
