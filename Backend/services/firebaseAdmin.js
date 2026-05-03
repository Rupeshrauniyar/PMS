const path = require("path");
const admin = require("firebase-admin");

let initialized = false;

function getMessaging() {
  if (!initialized) {
    if (!admin.apps.length) {
      const serviceAccount = require(path.join(
        __dirname,
        "..",
        "serviceAccountKey.json",
      ));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    initialized = true;
  }
  return admin.messaging();
}

module.exports = { getMessaging };
