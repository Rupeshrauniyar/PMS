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
  const fromCookie = tryDecodeRefreshTokenString(req.cookies?.[names.refresh]);
  if (fromCookie) return fromCookie;
  const headerRefresh = req.headers?.["x-refresh-token"];
  if (typeof headerRefresh === "string" && headerRefresh.trim()) {
    const decoded = tryDecodeRefreshTokenString(headerRefresh.trim());
    if (decoded) return decoded;
  }
  if (typeof req.body?.refreshToken === "string" && req.body.refreshToken.trim()) {
    return tryDecodeRefreshTokenString(req.body.refreshToken.trim());
  }
  return null;
}

/**
 * Verify an incoming Google / Firebase `idToken` when provided (Android GoogleAuth or Web Firebase).
 * Falls back cleanly to body fields for older client versions.
 */
async function resolveGoogleIdentity(body = {}) {
  const { idToken, email, uuid, username, pp } = body || {};
  if (idToken && typeof idToken === "string") {
    // 1. Try Firebase Admin ID token verification (Web signInWithPopup)
    try {
      const admin = require("firebase-admin");
      if (admin.apps.length) {
        const decoded = await admin.auth().verifyIdToken(idToken);
        if (decoded?.email) {
          return {
            email: decoded.email,
            uuid: decoded.sub || decoded.uid || uuid,
            username: decoded.name || username || decoded.email.split("@")[0],
            pp: decoded.picture || pp || "",
            verified: true,
          };
        }
      }
    } catch {
      /* Not a Firebase ID token — try Google OAuth2 tokeninfo next */
    }

    // 2. Try Google OAuth2 ID token (Native Android GoogleAuth.signIn)
    try {
      const resp = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      );
      if (resp.ok) {
        const info = await resp.json();
        if (info?.email && info?.sub) {
          return {
            email: info.email,
            uuid: uuid || info.sub,
            username: info.name || username || info.email.split("@")[0],
            pp: info.picture || pp || "",
            verified: true,
          };
        }
      }
    } catch {
      /* Fallback to explicit payload fields if offline / network issue */
    }
  }

  return {
    email,
    uuid,
    username: username || (email ? String(email).split("@")[0] : "User"),
    pp: pp || "",
    verified: false,
  };
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
  resolveGoogleIdentity,
  isValidObjectId,
  normalizeEmail,
  isValidEmail,
  sendServerError,
};
