// testFirestore.js
require("dotenv").config();
const admin = require("firebase-admin");

// ─── Debug: Confirm ENV Vars ───────────────────────────
if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  console.error("❌ Missing Firebase env vars. Check your .env file.");
  process.exit(1);
}

console.log("✅ Loaded Firebase env vars:");
console.log("   Project ID:", process.env.FIREBASE_PROJECT_ID);
console.log("   Client Email:", process.env.FIREBASE_CLIENT_EMAIL);
console.log(
  "   Private Key starts with:",
  process.env.FIREBASE_PRIVATE_KEY.slice(0, 30) + "..."
);

// ─── Initialize Firebase Admin ─────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

// ─── Test Firestore Write + Read ───────────────────────
(async () => {
  try {
    const testRef = db.collection("test").doc("hello");

    await testRef.set({ ok: true, ts: Date.now() });
    console.log("✅ Firestore write succeeded");

    const snap = await testRef.get();
    console.log("✅ Firestore read succeeded:", snap.data());
  } catch (err) {
    console.error("❌ Firestore test failed:", err.message);
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
