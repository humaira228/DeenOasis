// server/routes/orders.js
const router = require("express").Router();
const { authenticateToken } = require("./userAuth");
const Order = require("../models/order");
const User = require("../models/user");

// Place order
router.post("/place-order", authenticateToken, async (req, res) => {
    try {
        const { id } = req.headers;
        const { items, delivery, rentalDuration, total } = req.body;

        const user = await User.findById(id).populate("cart.book");
        
        if (user.cart.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        const order = new Order({
            user: id,
            items: user.cart.map(item => ({
                book: item.book._id,
                quantity: item.quantity
            })),
            total,
            delivery,
            rentalDuration,
            status: "processing"
        });

        await order.save();
        
        // Clear cart and add order to user history
        await User.findByIdAndUpdate(id, {
            $set: { cart: [] },
            $push: { orders: order._id }
        });

        return res.json({
            status: "Success",
            message: "Order Placed Successfully",
            data: order
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An Error Occurred" });
    }
});

// Get order history
router.get("/get-order-history", authenticateToken, async (req, res) => {
    try {
        const { id } = req.headers;
        const orders = await Order.find({ user: id })
            .populate("items.book")
            .sort({ createdAt: -1 });

        return res.json({
            status: "Success",
            data: orders
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An Error Occurred" });
    }
});

// Admin routes
router.get("/get-all-orders", authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("items.book")
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        return res.json({
            status: "Success",
            data: orders
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An Error Occurred" });
    }
});

router.put("/update-status/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        return res.json({
            status: "Success",
            message: "Order status updated",
            data: order
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An Error Occurred" });
    }
});

module.exports = router;