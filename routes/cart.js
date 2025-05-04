// server/routes/cart.js
const router = require("express").Router();
const User = require("../models/user");
const { authenticateToken } = require("./userAuth");

// Add to cart with quantity
router.put("/add-to-cart", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId, quantity = 1 } = req.body;

    const user = await User.findById(userId);
    const existingItem = user.cart.find(
      item => item.book.toString() === bookId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({
        book: bookId,
        quantity
      });
    }

    await user.save();
    // return populated cart for front-end
    await user.populate("cart.book");
    return res.json({
      status: "Success",
      message: "Cart updated",
      data: user.cart
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An Error Occurred" });
  }
});

// Remove from cart
router.put("/remove-from-cart/:bookId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.params;

    await User.findByIdAndUpdate(userId, {
      $pull: { cart: { book: bookId } }
    });

    const user = await User.findById(userId).populate("cart.book");
    return res.json({
      status: "Success",
      message: "Item removed from cart",
      data: user.cart
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An Error Occurred" });
  }
});

// Get user cart with populated data
router.get("/get-user-cart", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate("cart.book");
    // newest-first
    const cart = user.cart.slice().reverse();
    return res.json({
      status: "Success",
      data: cart
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An Error Occurred" });
  }
});

module.exports = router;
