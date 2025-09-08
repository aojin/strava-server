// initializeToken.js
require("dotenv").config();   // ✅ load env FIRST

const { saveToken } = require("./models/tokenStore");

(async () => {
  try {
    await saveToken({
      accessToken: "", // will be refreshed on first request
      refreshToken: process.env.STRAVA_REFRESH_TOKEN, // from initial OAuth exchange
      expiresAt: new Date(0).toISOString(), // expired → forces immediate refresh
    });

    console.log("✅ Initial refresh token saved to Firestore.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to save refresh token:", err.message);
    process.exit(1);
  }
})();
