// firebase.js
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json");

// Prevent "already initialized" error if this file is imported multiple times
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// ✅ Export a Firestore instance, not admin
const db = admin.firestore();
module.exports = db;
