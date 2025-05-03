const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]; // Get 'Authorization' header
  const token = authHeader && authHeader.split(" ")[1]; // Extract token

  if (!token) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  jwt.verify(token, "bookStore123", (err, user) => {
    if (err) {
      console.error("JWT Verification Error:", err.message); // Log error for debugging
      return res
        .status(403)
        .json({ message: "Token expired. Please sign in again" });
    }

    req.user = user; // Attach user data to the request
    next(); // Proceed to the next middleware
  });
};

module.exports = { authenticateToken };
