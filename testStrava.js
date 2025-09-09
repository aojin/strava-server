// testStrava.js
require("dotenv").config();
const axios = require("axios");

(async () => {
  try {
    // Debug: check envs
    console.log("✅ Loaded Strava env vars:");
    console.log("   Client ID:", process.env.STRAVA_CLIENT_ID);
    console.log("   Redirect URI:", process.env.STRAVA_REDIRECT_URI);
    console.log(
      "   Refresh token length:",
      process.env.STRAVA_REFRESH_TOKEN?.length || "MISSING"
    );

    if (
      !process.env.STRAVA_CLIENT_ID ||
      !process.env.STRAVA_CLIENT_SECRET ||
      !process.env.STRAVA_REFRESH_TOKEN
    ) {
      throw new Error("❌ Missing Strava env vars. Check .env file.");
    }

    // Call Strava to exchange refresh_token → access_token
    const res = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: process.env.STRAVA_REFRESH_TOKEN,
      grant_type: "refresh_token",
    });

    console.log("✅ Successfully refreshed Strava token!");
    console.log("   Access token:", res.data.access_token.slice(0, 15) + "...");
    console.log("   Expires at:", new Date(res.data.expires_at * 1000).toISOString());
  } catch (err) {
    console.error("❌ Failed to refresh Strava token:");
    console.error("Message:", err.message);
    console.error("Details:", err.response?.data || err);
  }
})();
