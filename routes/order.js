const router = require("express").Router();
const { authenticateToken } = require("./userAuth");
const Order = require("../models/order");
const User  = require("../models/user");

// Place order
router.post("/place-order", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const items = req.body.order;           // expects front-end to send { order: [...] }
    const { delivery, rentalDuration, total } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const order = new Order({
      user: userId,
      items: items.map(({ bookId, quantity }) => ({
        book: bookId,
        quantity
      })),
      delivery,
      rentalDuration,
      total,
      status: "Order Placed"
    });

    await order.save();

    // Clear cart and append to user orders
    await User.findByIdAndUpdate(userId, {
      $set: { cart: [] },
      $push: { orders: order._id }
    });

    return res.json({
      status: "Success",
      message: "Order Placed Successfully",
      data: order
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An Error Occurred" });
  }
});

// Get order history
router.get("/get-order-history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ user: userId })
      .populate("items.book")
      .sort({ createdAt: -1 });

    return res.json({
      status: "Success",
      data: orders
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An Error Occurred" });
  }
});

// Admin: get all orders
router.get("/get-all-orders", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const orders = await Order.find()
      .populate("items.book")
      .populate("user", "username email")
      .sort({ createdAt: -1 });

    return res.json({
      status: "Success",
      data: orders
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An Error Occurred" });
  }
});

// Admin: update status
router.put("/update-status/:id", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    return res.json({
      status: "Success",
      message: "Order status updated",
      data: order
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An Error Occurred" });
  }
});

module.exports = router;
