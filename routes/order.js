// server/routes/orders.js
const router = require("express").Router();
const { authenticateToken } = require("./userAuth");
const Book = require("../models/book");
const Order = require("../models/order");
const User = require("../models/user");

// place order
router.post("/place-order", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const { order, delivery, rentalDuration } = req.body;

    for (const orderData of order) {
      // use the payload’s bookId and quantity fields
      const newOrder = new Order({
        user: id,
        book: orderData.bookId,
        quantity: orderData.quantity,
        delivery,
        rentalDuration
      });
      const orderDataFromDb = await newOrder.save();

      // saving Order in user model & clearing cart
      await User.findByIdAndUpdate(id, {
        $push: { orders: orderDataFromDb._id },
        $pull: { cart: orderData.bookId }
      });
    }

    return res.json({
      status: "Success",
      message: "Order Placed Successfully"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "An Error Occurred" });
  }
});

// get order history of a particular user
router.get("/get-order-history", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const userData = await User.findById(id).populate({
      path: "orders",
      populate: { path: "book" }
    });
    const orderData = userData.orders.reverse();
    return res.json({
      status: "Success",
      data: orderData
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "An Error Occurred" });
  }
});

// get all orders (admin)
router.get("/get-all-orders", authenticateToken, async (req, res) => {
  try {
    const userData = await Order.find()
      .populate({ path: "book" })
      .populate({ path: "user" })
      .sort({ createdAt: -1 });
    return res.json({
      status: "Success",
      data: userData
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "An Error Occurred" });
  }
});

// update order status (admin)
router.put("/update-status/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await Order.findByIdAndUpdate(id, { status: req.body.status });
    return res.json({
      status: "Success",
      message: "Status Updated Successfully"
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "An Error Occurred" });
  }
});

module.exports = router;
