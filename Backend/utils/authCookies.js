const {
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES,
  getCookieNames,
  signAccessToken,
  signRefreshToken,
  tokenPayloadFromUserDoc,
} = require("./authHelpers");

function durationToCookieMaxAge(expiresIn) {
  const m = String(expiresIn).match(/^(\d+)([smhd])$/i);
  if (!m) return 15 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * (mult[u] || 60000);
}

function baseCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  const sameSite = process.env.COOKIE_SAME_SITE || (isProd ? "none" : "lax");
  const secure =
    isProd || process.env.FORCE_SECURE_COOKIES === "true";
  const domain = process.env.COOKIE_DOMAIN || undefined;
  return {
    httpOnly: true,
    secure,
    sameSite,
    ...(domain ? { domain } : {}),
    path: "/",
  };
}

function setAuthCookies(res, role, accessToken, refreshToken) {
  const names = getCookieNames(role);
  const base = baseCookieOptions();
  res.cookie(names.access, accessToken, {
    ...base,
    maxAge: durationToCookieMaxAge(ACCESS_TOKEN_EXPIRES),
  });
  res.cookie(names.refresh, refreshToken, {
    ...base,
    maxAge: durationToCookieMaxAge(REFRESH_TOKEN_EXPIRES),
  });
}

function clearAuthCookies(res, role) {
  const names = getCookieNames(role);
  const base = baseCookieOptions();
  res.clearCookie(names.access, { ...base, maxAge: 0 });
  res.clearCookie(names.refresh, { ...base, maxAge: 0 });
}

function setSessionForUser(res, userDoc, role = "user") {
  const payload = tokenPayloadFromUserDoc(userDoc);
  const access = signAccessToken(payload);
  const refresh = signRefreshToken(payload);
  setAuthCookies(res, role, access, refresh);
}

/**
 * Re-issue access + refresh from an existing refresh payload (rotation).
 */
function rotateSessionFromPayload(res, payload, role = "user") {
  const { id, type } = payload;
  const p = { id, ...(type ? { type } : {}) };
  const access = signAccessToken(p);
  const refresh = signRefreshToken(p);
  setAuthCookies(res, role, access, refresh);
}

module.exports = {
  setAuthCookies,
  clearAuthCookies,
  setSessionForUser,
  rotateSessionFromPayload,
  baseCookieOptions,
};
