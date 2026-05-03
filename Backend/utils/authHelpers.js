const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || JWT_SECRET;

const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m";
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "7d";

const BCRYPT_ROUNDS = Math.min(
  Math.max(parseInt(process.env.BCRYPT_ROUNDS || "10", 10), 10),
  14,
);

/** Cookie / CORS role names */
const USER_ACCESS_COOKIE = "access_token";
const USER_REFRESH_COOKIE = "refresh_token";
const BROKER_ACCESS_COOKIE = "broker_access_token";
const BROKER_REFRESH_COOKIE = "broker_refresh_token";

function assertJwtSecret() {
  if (!JWT_SECRET) {
    console.error("FATAL: JWT_SECRET environment variable is required.");
    process.exit(1);
  }
  if (process.env.NODE_ENV === "production") {
    if (!process.env.JWT_REFRESH_SECRET || JWT_REFRESH_SECRET === JWT_SECRET) {
      console.warn(
        "WARN: Set JWT_REFRESH_SECRET in production to a strong secret distinct from JWT_SECRET for refresh-token isolation.",
      );
    }
  } else if (!process.env.JWT_REFRESH_SECRET) {
    console.warn(
      "WARN: JWT_REFRESH_SECRET not set; using JWT_SECRET for refresh in development only.",
    );
  }
}

function getBearerToken(req) {
  const h = req.headers?.authorization;
  if (!h || typeof h !== "string") return null;
  const parts = h.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return null;
  return parts[1] || null;
}

/**
 * Verify access JWT (Authorization header, password-reset tokens will not have `id`).
 */
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

function tokenPayloadFromUserDoc(user) {
  const id = user._id || user.id;
  const type = user.authProvider === "google" ? "google" : undefined;
  return { id: String(id), ...(type ? { type } : {}) };
}

function signAccessToken(payload) {
  return jwt.sign(
    { ...payload, typ: "access" },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES },
  );
}

function signRefreshToken(payload) {
  return jwt.sign(
    { ...payload, typ: "refresh" },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES },
  );
}

/**
 * Decode access token from string; rejects refresh typ and missing id.
 */
function tryDecodeAccessTokenString(token) {
  if (!token) return null;
  try {
    const d = jwt.verify(token, JWT_SECRET);
    if (d.typ === "refresh" || !d.id) return null;
    return { id: String(d.id), type: d.type };
  } catch {
    return null;
  }
}

function tryDecodeRefreshTokenString(token) {
  if (!token) return null;
  try {
    const d = jwt.verify(token, JWT_REFRESH_SECRET);
    if (d.typ !== "refresh" || !d.id) return null;
    return { id: String(d.id), type: d.type };
  } catch {
    return null;
  }
}

function getCookieNames(role) {
  if (role === "broker") {
    return { access: BROKER_ACCESS_COOKIE, refresh: BROKER_REFRESH_COOKIE };
  }
  return { access: USER_ACCESS_COOKIE, refresh: USER_REFRESH_COOKIE };
}

function decodeAccessFromRequest(req, role = "user") {
  const names = getCookieNames(role);
  const fromCookie = tryDecodeAccessTokenString(req.cookies?.[names.access]);
  if (fromCookie) return fromCookie;
  const bearer = getBearerToken(req);
  if (bearer) return tryDecodeAccessTokenString(bearer);
  return null;
}

function tryUserIdFromRefreshCookie(req, role = "user") {
  const names = getCookieNames(role);
  return tryDecodeRefreshTokenString(req.cookies?.[names.refresh]);
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return EMAIL_RE.test(normalizeEmail(email));
}

function sendServerError(res, err, logLabel) {
  if (logLabel) console.error(logLabel, err?.message || err);
  else console.error(err);
  const dev = process.env.NODE_ENV === "development";
  return res.status(500).json({
    message: "Something went wrong.",
    ...(dev && err?.message ? { detail: err.message } : {}),
  });
}

module.exports = {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES,
  BCRYPT_ROUNDS,
  USER_ACCESS_COOKIE,
  USER_REFRESH_COOKIE,
  BROKER_ACCESS_COOKIE,
  BROKER_REFRESH_COOKIE,
  assertJwtSecret,
  getBearerToken,
  verifyAccessToken,
  verifyRefreshToken,
  tokenPayloadFromUserDoc,
  signAccessToken,
  signRefreshToken,
  tryDecodeAccessTokenString,
  tryDecodeRefreshTokenString,
  getCookieNames,
  decodeAccessFromRequest,
  tryUserIdFromRefreshCookie,
  isValidObjectId,
  normalizeEmail,
  isValidEmail,
  sendServerError,
};
