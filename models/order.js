// server/models/order.js
const mongoose = require("mongoose");

const order = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "user",           // unchanged
      required: true
    },
    book: {
      type: mongoose.Types.ObjectId,
      ref: "books",          // unchanged
      required: true
    },
    quantity: {              // newly added
      type: Number,
      required: true,
      min: 1
    },
    delivery: {              // newly added
      type: String,
      enum: ["inside", "outside"],
      required: true
    },
    rentalDuration: {        // newly added
      type: Number,
      enum: [7, 10, 20],
      required: true
    },
    status: {
      type: String,
      default: "Order Placed",
      enum: ["Order Placed", "Out for Delivery", "Delivered", "Canceled"]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("order", order);
