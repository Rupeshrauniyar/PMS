import api from "./client";

/**
 * Broker API layer — one function per broker endpoint.
 * Every function resolves with the response body (`res.data`) and lets
 * axios errors propagate (use `getErrorMessage` / `isConflict` from
 * `@/lib/errors` to interpret them).
 */

const data = (p) => p.then((res) => res.data);

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null && v !== "",
    ),
  );

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export const authApi = {
  checkAuth: () => data(api.get("/api/broker/auth/checkAuth")),
  signin: ({ email, password }) =>
    data(api.post("/api/broker/auth/signin", { email, password })),
  signup: ({ username, email, phone, password }) =>
    data(
      api.post("/api/broker/auth/signup", { username, email, phone, password }),
    ),
  signinWithGoogle: ({ email, uuid, username, pp, idToken }) =>
    data(
      api.post("/api/broker/auth/signinWithGoogle", {
        email,
        uuid,
        username,
        pp,
        idToken,
        type: "google",
      }),
    ),
  signout: ({ fcmToken } = {}) =>
    data(api.post("/api/broker/auth/signout", clean({ fcmToken }))),
  editProfile: ({ username, phone }) =>
    data(api.post("/api/broker/auth/edit-profile", { username, phone })),
  changePassword: ({ currentPassword, newPassword }) =>
    data(
      api.post("/api/broker/auth/edit-profile", {
        currentPassword,
        newPassword,
      }),
    ),
  updateFcmToken: (fcmToken) =>
    data(api.post("/api/broker/auth/update-fcm-token", { fcmToken })),

  // Password reset (shared credential endpoints). `accountType` lets the
  // backend target the broker collection.
  sendPasswordResetMail: (email) =>
    data(
      api.post("/api/cred/send-pass-reset-mail", {
        email,
        accountType: "broker",
      }),
    ),
  verifyResetToken: (token) =>
    data(api.post("/api/cred/verify-token", { token, accountType: "broker" })),
  resetPassword: ({ token, newPassword }) =>
    data(
      api.post("/api/cred/forgot-password", {
        token,
        newPassword,
        accountType: "broker",
      }),
    ),
};

/* ------------------------------------------------------------------ */
/* Visits                                                              */
/* ------------------------------------------------------------------ */

/** `{ broker, counts: { pool, claimed, scheduled, completed, noShow }, upcoming }` */
export const getDashboard = (opts) =>
  data(api.get("/api/broker/dashboard", opts));

/** `{ visits, page, limit, total, totalPages }` */
export const getPool = ({ page = 1, limit = 12 } = {}, opts) =>
  data(api.get("/api/broker/visits/pool", { params: { page, limit }, ...opts }));

/**
 * @param {{ status?: "open"|"closed"|"claimed"|"scheduled"|"completed"|"no_show"|"cancelled"|"all", from?: string, to?: string }} params
 * @returns `{ visits }`
 */
export const getMyVisits = (params = {}, opts) =>
  data(api.get("/api/broker/visits/mine", { params: clean(params), ...opts }));

/** Superbroker only. `{ visits }` */
export const getAllVisits = (params = {}, opts) =>
  data(api.get("/api/broker/visits/all", { params: clean(params), ...opts }));

/** `{ visit }` */
export const getVisit = (id, opts) =>
  data(api.get(`/api/broker/visits/${id}`, opts));

/** `{ visit }` — 409 if another broker claimed it first. */
export const claimVisit = (id) =>
  data(api.post(`/api/broker/visits/${id}/claim`));

/** Only from `claimed`. */
export const releaseVisit = (id, { reason } = {}) =>
  data(api.post(`/api/broker/visits/${id}/release`, clean({ reason })));

/** Schedule (from `claimed`) or reschedule (from `scheduled`). */
export const scheduleVisit = (id, { startAt, durationMin, meetingPoint, notes }) =>
  data(
    api.post(`/api/broker/visits/${id}/schedule`, {
      startAt,
      durationMin,
      meetingPoint,
      notes,
    }),
  );

export const completeVisit = (id, { outcome } = {}) =>
  data(api.post(`/api/broker/visits/${id}/complete`, clean({ outcome })));

export const markNoShow = (id, { outcome } = {}) =>
  data(api.post(`/api/broker/visits/${id}/no-show`, clean({ outcome })));

export const cancelVisit = (id, { reason } = {}) =>
  data(api.post(`/api/broker/visits/${id}/cancel`, clean({ reason })));

/** Superbroker only. */
export const reassignVisit = (id, brokerId) =>
  data(api.post(`/api/broker/visits/${id}/reassign`, { brokerId }));

/** Superbroker only. `{ brokers: [{ _id, username, email, phone, pp, role, assigned }] }` */
export const getBrokers = (opts) => data(api.get("/api/broker/brokers", opts));

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

/** `{ notifications, unreadCount }` */
export const getNotifications = (opts) =>
  data(api.get("/api/broker/auth/notifications", opts));

export const markNotificationRead = (id) =>
  data(api.patch(`/api/broker/auth/notifications/${id}/read`));

export const markAllNotificationsRead = () =>
  data(api.post("/api/broker/auth/notifications/read-all"));
