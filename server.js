const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const Token = require("./models/tokenModel");

dotenv.config();

const app = express();
app.use(cors()); // Enable CORS
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Function to get a valid access token
const getToken = async () => {
  try {
    let token = await Token.findOne({ user: "defaultUser" });
    if (!token) throw new Error("No token found");

    if (new Date() > token.expiresAt || !token.accessToken) {
      const response = await axios.post("https://www.strava.com/oauth/token", {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: token.refreshToken,
        grant_type: "refresh_token",
      });

      token = await Token.findOneAndUpdate(
        { user: "defaultUser" },
        {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
        },
        { new: true }
      );
    }

    return token.accessToken;
  } catch (err) {
    console.error(
      "Error fetching token:",
      err.response ? err.response.data : err.message
    );
    throw new Error("Failed to refresh Strava token");
  }
};

// Endpoint to get a valid access token
app.get("/get-access-token", async (req, res) => {
  try {
    const accessToken = await getToken();
    res.json({ access_token: accessToken });
  } catch (err) {
    console.error(
      "Error fetching access token:",
      err.response ? err.response.data : err.message
    );
    res.status(500).json({ error: "Failed to fetch access token" });
  }
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/strava-data", async (req, res) => {
  const { page = 1, per_page = 30 } = req.query; // Default to page 1 and 30 items per page

  try {
    const accessToken = await getToken();
    const response = await axios.get(
      "https://www.strava.com/api/v3/athlete/activities",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          page,
          per_page,
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error(
      "Error fetching Strava data:",
      err.response ? err.response.data : err.message
    );
    res.status(500).json({ error: "Failed to fetch Strava data" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
