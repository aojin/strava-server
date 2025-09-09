// models/tokenStore.js
const db = require("../firebase");

/**
 * Get a token document from Firestore
 */
async function getTokenDoc(userId = "defaultUser") {
  const docRef = db.collection("tokens").doc(userId);
  const doc = await docRef.get();
  return doc.exists ? doc.data() : null;
}

/**
 * Save or update a token in Firestore
 */
async function saveToken(data, userId = "defaultUser") {
  const docRef = db.collection("tokens").doc(userId);

  const tokenData = {
    ...data,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date(0),
  };

  await docRef.set(tokenData, { merge: true });
  return tokenData;
}

module.exports = { getTokenDoc, saveToken };
