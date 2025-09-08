// testFirestore.js
require("dotenv").config();
const admin = require("firebase-admin");

// ─── Debug: Confirm ENV Vars ───────────────────────────
if (!process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY) {
  console.error("❌ Missing Firebase env vars. Check your .env file.");
  process.exit(1);
}

console.log("✅ Loaded Firebase env vars. Private key length:", process.env.FIREBASE_PRIVATE_KEY.length);

// ─── Initialize Firebase Admin ─────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

// ─── Test Firestore Write ──────────────────────────────
(async () => {
  try {
    await db.collection("test").doc("hello").set({ ok: true, ts: Date.now() });
    console.log("✅ Firestore write succeeded");
  } catch (err) {
    console.error("❌ Firestore write failed:", err);
  }
})();
