const router = require("express").Router();
const User   = require("../models/user");
const Book   = require("../models/book");
const { authenticateToken } = require("./userAuth");
const { transliterate }     = require("transliteration");
const Joi                  = require("joi");

// --- Validation schema for create/update ---
const bookSchema = Joi.object({
  url:            Joi.string().uri().required(),
  title:          Joi.string().min(1).required(),
  author:         Joi.string().min(1).required(),
  price:          Joi.number().min(0).required(),
  desc:           Joi.string().allow(""),
  language:       Joi.string().required(),
  availableStock: Joi.number().integer().min(0).default(0)
});

// --- Helper: require admin role ---
async function ensureAdmin(req, res) {
  const user = await User.findById(req.user.id);
  if (!user || user.role !== "admin") {
    return res.status(403).json({
      status:  "error",
      message: "Admin access required",
      data:    null
    });
  }
  return user;
}

// ➕ Add Book (Admin only)
router.post("/add-book", authenticateToken, async (req, res) => {
  // Validate request body
  const { error, value } = bookSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status:  "error",
      message: error.message,
      data:    null
    });
  }

  const admin = await ensureAdmin(req, res);
  if (!admin) return;

  const { title, author, ...rest } = value;
  // Only transliterate non-ASCII strings
  const transliteratedTitle  = /[^\u0000-\u007F]/.test(title)
    ? transliterate(title, { from: "devanagari", to: "beng" })
    : title;
  const transliteratedAuthor = /[^\u0000-\u007F]/.test(author)
    ? transliterate(author, { from: "devanagari", to: "beng" })
    : author;

  const book = new Book({
    ...rest,
    title,
    author,
    transliteratedTitle,
    transliteratedAuthor
  });

  await book.save();
  res.status(201).json({
    status:  "success",
    message: "Book added successfully",
    data:    book
  });
});

// ✏️ Update Book (Admin only)
router.put("/update-book/:id", authenticateToken, async (req, res) => {
  const admin = await ensureAdmin(req, res);
  if (!admin) return;

  // Make only provided fields optional and validate them
  const { error, value } = bookSchema
    .fork(Object.keys(req.body), (schema) => schema.optional())
    .validate(req.body);

  if (error) {
    return res.status(400).json({
      status:  "error",
      message: error.message,
      data:    null
    });
  }

  if (value.title) {
    value.transliteratedTitle = /[^\u0000-\u007F]/.test(value.title)
      ? transliterate(value.title, { from: "devanagari", to: "beng" })
      : value.title;
  }
  if (value.author) {
    value.transliteratedAuthor = /[^\u0000-\u007F]/.test(value.author)
      ? transliterate(value.author, { from: "devanagari", to: "beng" })
      : value.author;
  }

  const updated = await Book.findByIdAndUpdate(
    req.params.id,
    value,
    { new: true, runValidators: true }
  );
  if (!updated) {
    return res.status(404).json({
      status:  "error",
      message: "Book not found",
      data:    null
    });
  }

  res.json({
    status:  "success",
    message: "Book updated successfully",
    data:    updated
  });
});

// ❌ Delete Book (Admin only)
router.delete("/delete-book/:id", authenticateToken, async (req, res) => {
  const admin = await ensureAdmin(req, res);
  if (!admin) return;

  const deleted = await Book.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({
      status:  "error",
      message: "Book not found",
      data:    null
    });
  }

  res.json({
    status:  "success",
    message: "Book deleted successfully",
    data:    deleted
  });
});

// 📚 Get All Books (public)
router.get("/get-all-books", async (req, res) => {
  const books = await Book.find().sort({ createdAt: -1 });
  res.json({
    status:  "success",
    message: "Books fetched successfully",
    data:    books
  });
});

// 🆕 Get Recent Books (limit 4)
router.get("/get-recent-books", async (req, res) => {
  const books = await Book.find().sort({ createdAt: -1 }).limit(4);
  res.json({
    status:  "success",
    message: "Recent books fetched successfully",
    data:    books
  });
});

// 🔍 Search Books (uses MongoDB text index)
router.get("/search-books", async (req, res) => {
  const { query } = req.query;
  if (!query?.trim()) {
    return res.status(400).json({
      status:  "error",
      message: "Search query is required",
      data:    null
    });
  }

  // Ensure you have defined a text index on Book schema:
  // BookSchema.index(
  //   { title: "text", author: "text", language: "text" },
  //   { weights: { title: 5, author: 3, language: 1 } }
  // );

  const results = await Book
    .find({ $text: { $search: query } }, { score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } });

  res.json({
    status:  "success",
    message: "Books fetched successfully",
    data:    results
  });
});

// 📖 Get Single Book by ID (protected)
router.get("/get-book-by-id/:id", authenticateToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        status:  "error",
        message: "Book not found",
        data:    null
      });
    }
    res.json({
      status:  "success",
      message: "Book fetched successfully",
      data:    book
    });
  } catch (err) {
    console.error("Error fetching book by ID:", err);
    res.status(500).json({
      status:  "error",
      message: "Internal Server Error",
      data:    null
    });
  }
});

module.exports = router;
