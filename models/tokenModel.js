const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  user: { type: String, required: true },
  accessToken: { type: String }, // Remove required constraint
  refreshToken: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model("Token", tokenSchema);
