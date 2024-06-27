const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  accessToken: String,
  refreshToken: String,
  expiresAt: Date,
});

module.exports = mongoose.model("Token", tokenSchema);
