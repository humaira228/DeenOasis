// routes/userAuth.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token      = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  const secret = process.env.JWT_SECRET || "bookStore123";
  jwt.verify(token, secret, (err, payload) => {
    if (err) {
      console.error("JWT Verification Error:", err.message);
      return res
        .status(403)
        .json({ message: "Invalid or expired token" });
    }
    // Expect your login route to sign with: { id: user._id, role: user.role }
    req.user = {
      id:   payload.id   || payload.sub,
      role: payload.role || (payload.authClaims && payload.authClaims.find(c => c.role).role)
    };
    next();
  });
};

module.exports = { authenticateToken };
