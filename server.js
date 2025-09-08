// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const axios = require("axios");
const axiosRetry = require("axios-retry").default;
const getToken = require("./getToken"); // Firestore + refresh logic
const { saveToken } = require("./models/tokenStore");

dotenv.config();

// ─── Validate Required ENV Vars ────────────────
[
  "STRAVA_CLIENT_ID",
  "STRAVA_CLIENT_SECRET",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
].forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`❌ Missing required env var: ${key}`);
  }
});

// ─── Axios Retry (transient errors) ────────────
axiosRetry(axios, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // retry on network errors & 5xx only
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status >= 500;
  },
});

const app = express();
app.use(cors());
app.use(express.json());

// ─── Health Check ──────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Strava server is running 🚴" });
});

// ─── Get a valid Strava access token ───────────
app.get("/get-access-token", async (req, res) => {
  try {
    const accessToken = await getToken();
    res.json({ access_token: accessToken });
  } catch (err) {
    console.error("❌ Error fetching access token:", err.message);

    // Detect invalid refresh token
    if (err.response?.status === 400) {
      return res.status(400).json({
        error: "Invalid refresh token. Please re-run /exchange_token.",
        details: err.response.data,
      });
    }

    res.status(500).json({ error: "Failed to fetch access token" });
  }
});

// ─── Fetch athlete activities ──────────────────
app.get("/strava-data", async (req, res) => {
  const { page = 1, per_page = 30 } = req.query;

  try {
    const accessToken = await getToken();
    const response = await axios.get(
      "https://www.strava.com/api/v3/athlete/activities",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { page, per_page },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error("❌ Error fetching Strava data:");
    console.error("Status:", err.response?.status);
    console.error("Data:", err.response?.data);
    console.error("Message:", err.message);

    res.status(500).json({
      error: "Failed to fetch Strava data",
      details: err.response?.data || err.message,
    });
  }
});

// ─── One-Time OAuth Exchange (optional) ────────
app.get("/exchange_token", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: "Missing authorization code" });

  try {
    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    });

    const { access_token, refresh_token, expires_at } = response.data;

    // Save to Firestore so auto-refresh works forever
    await saveToken({
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(expires_at * 1000).toISOString(),
    });

    res.json({
      message: "✅ Tokens exchanged and saved successfully",
      data: response.data,
    });
  } catch (err) {
    console.error("❌ Error exchanging token:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to exchange token" });
  }
});

// 🚨 Do NOT call app.listen() on Vercel!
// Instead export the app so Vercel can mount it.
module.exports = app;
