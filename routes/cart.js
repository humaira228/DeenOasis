// server/routes/cart.js
const router = require("express").Router();
const User = require("../models/user"); 
const { authenticateToken } = require("./userAuth");

// Add to cart with quantity
router.put("/add-to-cart", authenticateToken, async (req, res) => {
    try {
        const { bookId, quantity } = req.body;
        const { id } = req.headers;

        const user = await User.findById(id);
        const existingItem = user.cart.find(item => item.book.toString() === bookId);

        if (existingItem) {
            existingItem.quantity += quantity || 1;
        } else {
            user.cart.push({ 
                book: bookId, 
                quantity: quantity || 1 
            });
        }

        await user.save();
        return res.json({
            status: "Success",
            message: "Cart updated",
            data: user.cart
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An Error Occurred" });
    }
});

// Remove from cart
router.put("/remove-from-cart/:bookId", authenticateToken, async (req, res) => {
    try {
        const { bookId } = req.params;
        const { id } = req.headers;

        await User.findByIdAndUpdate(id, {
            $pull: { cart: { book: bookId } }
        });

        return res.json({
            status: "Success",
            message: "Item removed from cart"
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An Error Occurred" });
    }
});

// Get user cart with populated data
router.get("/get-user-cart", authenticateToken, async (req, res) => {
    try {
        const { id } = req.headers;
        const user = await User.findById(id)
            .populate({
                path: "cart.book",
                model: "Book"
            });

        return res.json({
            status: "Success",
            data: user.cart.reverse()
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An Error Occurred" });
    }
});

module.exports = router;