// server/routes/userAuth.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]; 
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "bookStore123", (err, payload) => {
    if (err) {
      console.error("JWT Verification Error:", err.message);
      return res
        .status(403)
        .json({ message: "Token expired or invalid. Please sign in again." });
    }
    // payload should include your user ID under e.g. payload.id or payload.sub
    req.user = {
      id: payload.id || payload.sub,
      role: payload.role || (payload.authClaims && payload.authClaims.role)
    };
    next();
  });
};

module.exports = { authenticateToken };
