// server/models/user.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  contact: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{11}$/, "Please enter a valid 11-digit phone number"],
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: "https://cdn-icons-png.flaticon.com/128/3177/3177440.png",
  },
  role: {
    type: String,
    default: "user",
    enum: ["user", "admin"],
  },
  favourites: [{
    type: mongoose.Types.ObjectId,
    ref: "Book",
  }],
  cart: [{
    book: {
      type: mongoose.Types.ObjectId,
      ref: "Book",
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
  orders: [{
    type: mongoose.Types.ObjectId,
    ref: "Order",
  }],
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);