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
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const getToken = async () => {
  try {
    const token = await Token.findOne();
    if (!token) throw new Error("No token found");

    if (new Date() > token.expiresAt) {
      const response = await axios.post("https://www.strava.com/oauth/token", {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: token.refreshToken,
        grant_type: "refresh_token",
      });

      token.accessToken = response.data.access_token;
      token.refreshToken = response.data.refresh_token;
      token.expiresAt = new Date(Date.now() + response.data.expires_in * 1000);
      await token.save();
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

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.get("/strava-data", async (req, res) => {
  try {
    const accessToken = await getToken();
    const response = await axios.get(
      "https://www.strava.com/api/v3/athlete/activities",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
