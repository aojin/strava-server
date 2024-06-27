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
      accessToken: "",
      refreshToken: "4134fad775a822b698061257d6bf7cd75f9be7a5",
      expiresAt: new Date(),
    });
    return token.save();
  })
  .then(() => {
    console.log("Token saved");
    mongoose.connection.close();
  })
  .catch((err) => console.log(err));
