const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Token = require("./models/tokenModel");

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
    const token = new Token({
      user: "defaultUser",
      accessToken: "", // Initially empty, will be refreshed
      refreshToken: "4c218f6b17035895f7a57c381cd7554e3f249646", // Replace with actual refresh token
      expiresAt: new Date(), // Set to current date, will be refreshed
    });
    return token.save();
  })
  .then(() => {
    console.log("Token saved");
    mongoose.connection.close();
  })
  .catch((err) => console.log(err));
