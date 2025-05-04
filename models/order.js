// server/models/order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: [{
      book: {
        type: mongoose.Types.ObjectId,
        ref: "Book",
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      }
    }],
    delivery: {
      type: String,
      enum: ["inside", "outside"],
      required: true
    },
    rentalDuration: {
      type: Number,
      enum: [7, 10, 20],
      required: true
    },
    total: {
      type: Number,
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

module.exports = mongoose.model("Order", orderSchema);