const express = require("express");
const cors    = require("cors");
require("dotenv").config();
require("./conn/conn"); // MongoDB connection

const app = express();

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://wonderful-mousse-eb994f.netlify.app"
];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy does not allow this origin: " + origin));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Mount routes
app.use("/api/v1", require("./routes/user"));      // auth & profile
app.use("/api/v1", require("./routes/book"));      // book CRUD & search
app.use("/api/v1", require("./routes/favourite")); // favourites
app.use("/api/v1", require("./routes/cart"));      // cart
app.use("/api/v1", require("./routes/order"));     // orders

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: err.message
  });
});

const PORT = process.env.PORT || 1000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
