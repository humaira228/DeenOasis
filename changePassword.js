const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Replace with your actual MongoDB connection string
const MONGO_URI = "mongodb://localhost:27017/your_db_name";

// Replace with the user's username or _id
const username = "tcm123"; // or use _id instead
const newPassword = "myNewSecurePassword123"; // new password to set

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  // add any other fields if needed
});

const User = mongoose.model("User", userSchema);

async function changePassword() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const hash = await bcrypt.hash(newPassword, 10);

    const result = await User.findOneAndUpdate(
      { username }, // or { _id: "yourUserId" }
      { password: hash },
      { new: true }
    );

    if (result) {
      console.log("✅ Password updated successfully for user:", username);
    } else {
      console.log("❌ User not found.");
    }
  } catch (error) {
    console.error("Error changing password:", error);
  } finally {
    mongoose.disconnect();
  }
}

changePassword();
