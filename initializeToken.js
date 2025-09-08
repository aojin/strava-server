// initializeToken.js
const dotenv = require("dotenv");
const { saveToken } = require("./models/tokenStore");

dotenv.config();

(async () => {
  try {
    await saveToken({
      accessToken: "", // will be refreshed on first request
      refreshToken: process.env.STRAVA_REFRESH_TOKEN, // from initial OAuth exchange
      expiresAt: new Date(0).toISOString(), // expired → forces immediate refresh
    });

    console.log("✅ Initial refresh token saved to Firestore.");
    process.exit(0); // exit script cleanly
  } catch (err) {
    console.error("❌ Failed to save refresh token:", err.message);
    process.exit(1);
  }
})();
