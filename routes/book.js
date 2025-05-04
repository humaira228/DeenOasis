const router = require("express").Router();
const User = require("../models/user");
const Book = require("../models/book");
const { authenticateToken } = require("./userAuth");
const { transliterate } = require("transliteration");

// Utility to send consistent error responses
const sendError = (res, message, code = 500) => {
  return res.status(code).json({ status: "error", message, data: [] });
};

// Utility to check if user is admin
const ensureAdmin = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user || user.role !== "admin") {
    sendError(res, "Admin access required", 403);
    return null;
  }
  return user;
};

// ➕ Add Book (Admin only)
router.post("/add-book", authenticateToken, async (req, res) => {
  try {
    const admin = await ensureAdmin(req, res);
    if (!admin) return;

    const { url, title, author, price, desc, language, availableStock = 0 } = req.body;

    // Generate Bengali transliterations
    const transliteratedTitle = transliterate(title, { from: "devanagari", to: "beng" });
    const transliteratedAuthor = transliterate(author, { from: "devanagari", to: "beng" });

    const book = new Book({
      url,
      title,
      author,
      price,
      desc,
      language,
      availableStock,
      transliteratedTitle,
      transliteratedAuthor
    });
    await book.save();

    res.status(200).json({ status: "success", message: "Book added successfully", data: book });
  } catch (error) {
    console.error("Error adding book:", error);
    sendError(res, "Internal Server Error");
  }
});

// ✏️ Update Book (Admin only)
router.put("/update-book/:id", authenticateToken, async (req, res) => {
  try {
    const admin = await ensureAdmin(req, res);
    if (!admin) return;

    const updateFields = { ...req.body };
    if (req.body.title) {
      updateFields.transliteratedTitle = transliterate(req.body.title, { from: "devanagari", to: "beng" });
    }
    if (req.body.author) {
      updateFields.transliteratedAuthor = transliterate(req.body.author, { from: "devanagari", to: "beng" });
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );
    if (!updatedBook) {
      return sendError(res, "Book not found", 404);
    }

    res.status(200).json({ status: "success", message: "Book updated successfully", data: updatedBook });
  } catch (error) {
    console.error("Error updating book:", error);
    sendError(res, "Internal Server Error");
  }
});

// ❌ Delete Book (Admin only)
router.delete("/delete-book/:id", authenticateToken, async (req, res) => {
  try {
    const admin = await ensureAdmin(req, res);
    if (!admin) return;

    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    if (!deletedBook) {
      return sendError(res, "Book not found", 404);
    }

    res.status(200).json({ status: "success", message: "Book deleted successfully", data: deletedBook });
  } catch (error) {
    console.error("Error deleting book:", error);
    sendError(res, "Internal Server Error");
  }
});

// 📚 Get All Books
router.get("/get-all-books", async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.status(200).json({ status: "success", message: "Books fetched successfully", data: books });
  } catch (error) {
    console.error("Error fetching all books:", error);
    sendError(res, "Internal Server Error");
  }
});

// 🆕 Get Recent Books (limit 4)
router.get("/get-recent-books", async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 }).limit(4);
    res.status(200).json({ status: "success", message: "Recent books fetched successfully", data: books });
  } catch (error) {
    console.error("Error fetching recent books:", error);
    sendError(res, "Internal Server Error");
  }
});

// 🔍 Search Books (Smart transliteration search)
router.get("/search-books", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || !query.trim()) {
      return sendError(res, "Search query is required", 400);
    }

    const q = query.trim();
    const beng = transliterate(q, { from: "devanagari", to: "beng" });
    const reQ = new RegExp(q, "i");
    const reB = new RegExp(beng, "i");
    const reT = new RegExp(transliterate(q, { from: "devanagari", to: "itrans" }), "i");

    // Aggregate with scoring
    const books = await Book.aggregate([
      { $match: {
          $or: [
            { title: reQ },
            { transliteratedTitle: reB },
            { author: reQ },
            { transliteratedAuthor: reB },
            { language: reQ }
          ]
      }},
      { $addFields: {
          score: {
            $switch: {
              branches: [
                { case: { $regexMatch: { input: "$title", regex: reQ } }, then: 100 },
                { case: { $regexMatch: { input: "$transliteratedTitle", regex: reB } }, then: 90 },
                { case: { $regexMatch: { input: "$author", regex: reQ } }, then: 80 },
                { case: { $regexMatch: { input: "$transliteratedAuthor", regex: reB } }, then: 70 },
                { case: { $regexMatch: { input: "$language", regex: reQ } }, then: 60 }
              ],
              default: 0
            }
          }
      }},
      { $sort: { score: -1, title: 1 } }
    ]);

    res.status(200).json({ status: "success", message: "Books fetched successfully", data: books });
  } catch (error) {
    console.error("Error searching books:", error);
    sendError(res, "Internal Server Error");
  }
});

// 📖 Get Single Book by ID
router.get("/get-book-by-id/:id", authenticateToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return sendError(res, "Book not found", 404);
    }
    res.status(200).json({ status: "success", message: "Book fetched successfully", data: book });
  } catch (error) {
    console.error("Error fetching book by ID:", error);
    sendError(res, "Internal Server Error");
  }
});

module.exports = router;
