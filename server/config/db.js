const mongoose = require("mongoose");

const connectDB = async () => {
  try {

    let uri = process.env.MONGO_URI || "";
    if (!/retryWrites=/.test(uri)) {
      uri += (uri.includes("?") ? "&" : "?") + "retryWrites=false";
    }

    await mongoose.connect(
      uri
    );

    console.log("MongoDB Connected");

  } catch (error) {

    console.log(error.message);

    process.exit(1);
  }
};

module.exports = connectDB;