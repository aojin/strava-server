const axios = require("axios");
const { getTokenDoc, saveToken } = require("./models/tokenStore");

async function getToken() {
  let token = await getTokenDoc();

  if (!token) {
    throw new Error("No token found in Firestore. Run initializeToken.js first.");
  }

  const isExpired =
    !token.accessToken || Date.now() >= new Date(token.expiresAt).getTime();

  if (isExpired) {
    console.log("Access token expired. Refreshing from Strava...");

    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: token.refreshToken,
      grant_type: "refresh_token",
    });

    token = {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000).toISOString(),
    };

    await saveToken(token);
    console.log("✅ Strava access token refreshed");
  }

  return token.accessToken;
}

module.exports = getToken;
