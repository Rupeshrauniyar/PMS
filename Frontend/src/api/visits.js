import api from "./client";

/**
 * Request a new site visit for a property.
 * @param {{ propId: string, preferredSlots: string[], note?: string }} payload
 */
export async function requestVisit({ propId, preferredSlots = [], note = "" }) {
  const { data } = await api.post("/api/visits", {
    propId,
    preferredSlots,
    note,
  });
  return data;
}

/**
 * List visits for the current user as buyer or owner.
 * @param {{ role?: "buyer" | "owner", status?: string }} params
 */
export async function listMyVisits({ role = "buyer", status = "all" } = {}) {
  const { data } = await api.get("/api/visits", {
    params: { role, status },
  });
  return data;
}

/**
 * Get full details of a single visit (3-party view).
 * @param {string} id
 */
export async function getVisit(id) {
  const { data } = await api.get(`/api/visits/${encodeURIComponent(id)}`);
  return data;
}

/**
 * Owner approves a requested visit (sends to broker pool).
 * @param {string} id
 * @param {{ note?: string }} body
 */
export async function approveVisit(id, { note = "" } = {}) {
  const { data } = await api.post(
    `/api/visits/${encodeURIComponent(id)}/approve`,
    note ? { note } : {},
  );
  return data;
}

/**
 * Owner declines a requested visit.
 * @param {string} id
 * @param {{ note?: string }} body
 */
export async function rejectVisit(id, { note = "" } = {}) {
  const { data } = await api.post(
    `/api/visits/${encodeURIComponent(id)}/reject`,
    note ? { note } : {},
  );
  return data;
}

/**
 * Buyer or owner cancels an open visit.
 * @param {string} id
 * @param {{ reason?: string }} body
 */
export async function cancelVisit(id, { reason = "" } = {}) {
  const { data } = await api.post(
    `/api/visits/${encodeURIComponent(id)}/cancel`,
    reason ? { reason } : {},
  );
  return data;
}
