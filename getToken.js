const axios = require("axios");
const { getTokenDoc, saveToken } = require("./models/tokenStore");

// Helper to normalize Firestore Timestamp | Date | ISO string -> ms
function toMs(expiresAt) {
  if (!expiresAt) return 0;
  // Firestore Timestamp has toDate()
  if (typeof expiresAt.toDate === "function") {
    return expiresAt.toDate().getTime();
  }
  const d = new Date(expiresAt);
  const t = d.getTime();
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Fetches a valid Strava access token.
 * Refreshes from Strava if expired or near-expired.
 */
async function getToken() {
  let token = await getTokenDoc();

  if (!token) {
    throw new Error("No token found in Firestore. Run /exchange_token first.");
  }

  const now = Date.now();
  const expMs = toMs(token.expiresAt);

  // Refresh if missing, expired, or expiring within 2 minutes
  const needsRefresh =
    !token.accessToken || !expMs || now >= expMs - 2 * 60 * 1000;

  if (needsRefresh) {
    console.log("⚠️ Access token missing/expired/near-expiry. Refreshing from Strava...");

    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: token.refreshToken,
      grant_type: "refresh_token",
    });

    // Strava rotates refresh tokens — always save the new one
    const { access_token, refresh_token, expires_in, expires_at } = response.data;
    const newExpiryIso =
      expires_at
        ? new Date(expires_at * 1000).toISOString()
        : new Date(now + expires_in * 1000).toISOString();

    token = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: newExpiryIso,
    };

    await saveToken(token);
    console.log("✅ Strava access token refreshed and saved");
  }

  return token.accessToken;
}

module.exports = getToken;
