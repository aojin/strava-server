// models/tokenStore.js
const db = require("../firebase");

/**
 * Get a token document from Firestore
 * @param {string} userId - Document ID (default "defaultUser")
 */
async function getTokenDoc(userId = "defaultUser") {
  try {
    const docRef = db.collection("tokens").doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) return null;
    return doc.data();
  } catch (err) {
    console.error("❌ Failed to fetch token from Firestore:", err.message);
    throw err;
  }
}

/**
 * Save or update a token in Firestore
 * @param {object} data - Token data
 * @param {string} userId - Document ID (default "defaultUser")
 */
async function saveToken(data, userId = "defaultUser") {
  try {
    const docRef = db.collection("tokens").doc(userId);

    // Normalize expiresAt: store as Firestore Timestamp
    const tokenData = {
      ...data,
      expiresAt: data.expiresAt
        ? new Date(data.expiresAt)
        : new Date(0), // fallback if missing
    };

    await docRef.set(tokenData, { merge: true });
    return tokenData;
  } catch (err) {
    console.error("❌ Failed to save token to Firestore:", err.message);
    throw err;
  }
}

module.exports = { getTokenDoc, saveToken };
