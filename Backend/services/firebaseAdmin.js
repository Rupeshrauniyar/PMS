const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");

let initialized = false;

function ensureFirebaseApp() {
  if (!initialized) {
    if (!admin.apps.length) {
      const keyPath = path.join(__dirname, "..", "serviceAccountKey.json");
      if (fs.existsSync(keyPath)) {
        const serviceAccount = require(keyPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        throw new Error("serviceAccountKey.json not found");
      }
    }
    initialized = true;
  }
  return admin;
}

function getMessaging() {
  return ensureFirebaseApp().messaging();
}

function getAuth() {
  return ensureFirebaseApp().auth();
}

module.exports = { ensureFirebaseApp, getMessaging, getAuth };
