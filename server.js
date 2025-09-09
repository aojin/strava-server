// server.js
require("./config"); // ✅ loads .env before anything else

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const getToken = require("./getToken"); // your Fix 1 logic inside
const { getTokenDoc, saveToken } = require("./models/tokenStore");

[
  "STRAVA_CLIENT_ID",
  "STRAVA_CLIENT_SECRET",
  "STRAVA_REDIRECT_URI",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "ADMIN_TOKEN", // 🔐 NEW: guard admin endpoints
].forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`❌ Missing required env var: ${key}`);
  }
});

const app = express();
app.use(cors());
app.use(express.json());

// ─── tiny auth middleware for admin routes ───────────────────────
function requireAdmin(req, res, next) {
  const token = req.header("x-admin-token");
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ─── Health Check ────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Strava server is running 🚴" });
});

// ─── Get a valid Strava access token ─────────────────────────────
app.get("/get-access-token", async (req, res) => {
  try {
    const accessToken = await getToken();
    res.json({ access_token: accessToken });
  } catch (err) {
    console.error("❌ Error fetching access token:", err.message);

    if (err.response?.status === 400) {
      return res.status(400).json({
        error: "Invalid refresh token. Please re-run /exchange_token.",
        details: err.response.data,
      });
    }

    res.status(500).json({ error: "Failed to fetch access token" });
  }
});

// ─── Fetch athlete activities (with one 401 retry) ───────────────
app.get("/strava-data", async (req, res) => {
  const { page = 1, per_page = 30 } = req.query;

  async function callStravaOnce() {
    const accessToken = await getToken(); // Fix 1 handles near-expiry
    return axios.get("https://www.strava.com/api/v3/athlete/activities", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page, per_page },
      timeout: 15000,
    });
  }

  try {
    let response;
    try {
      response = await callStravaOnce();
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        console.warn("🔄 401 from Strava — retrying once after refresh");
        // getToken() will refresh due to the 2-min buffer; call again
        response = await callStravaOnce();
      } else {
        throw err;
      }
    }
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

// ─── One-Time OAuth Exchange ─────────────────────────────────────
app.get("/exchange_token", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: "Missing authorization code" });

  try {
    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: process.env.STRAVA_REDIRECT_URI,
    });

    const { access_token, refresh_token, expires_at } = response.data;

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
    console.error("❌ Error exchanging token:");
    console.error("Status:", err.response?.status);
    console.error("Data:", err.response?.data);
    console.error("Message:", err.message);

    res.status(500).json({
      error: "Failed to exchange token",
      details: err.response?.data || err.message,
    });
  }
});

// ─── Admin: inspect token meta (no secrets) ──────────────────────
app.get("/admin/token-meta", requireAdmin, async (req, res) => {
  const t = await getTokenDoc();
  if (!t) return res.status(404).json({ error: "No token document found" });

  // Don’t leak actual tokens
  res.json({
    hasAccessToken: !!t.accessToken,
    hasRefreshToken: !!t.refreshToken,
    expiresAt: t.expiresAt?.toDate ? t.expiresAt.toDate() : t.expiresAt,
  });
});

// ─── Admin: invalidate current access token (force refresh later) ─
app.post("/admin/invalidate", requireAdmin, async (req, res) => {
  const t = await getTokenDoc();
  if (!t) return res.status(404).json({ error: "No token document found" });

  await saveToken({
    ...t,
    accessToken: "", // clearing access token forces refresh next time
  });
  res.json({ message: "✅ accessToken cleared. Next call will refresh." });
});

// ─── Admin: force refresh now (immediate) ────────────────────────
app.post("/admin/force-refresh", requireAdmin, async (req, res) => {
  try {
    // Cheapest way: call getToken(); it will refresh if missing/near-expiry
    const token = await getToken();
    res.json({ message: "✅ Token is valid (refreshed if needed)", preview: token ? "present" : "missing" });
  } catch (err) {
    console.error("❌ force-refresh failed:", err.message);
    res.status(500).json({ error: "Force refresh failed", details: err.message });
  }
});

// 🚨 Do NOT call app.listen() on Vercel!
module.exports = app;
