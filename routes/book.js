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
  const user = await User.findById(req.headers.id);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ status: "error", message: "Admin access required", data: [] });
  }
  return user;
};

// ➕ Add Book (Admin only)
router.post("/add-book", authenticateToken, async (req, res) => {
  try {
    const admin = await ensureAdmin(req, res);
    if (!admin) return;

    const { url, title, author, price, desc, language } = req.body;

    const book = new Book({ url, title, author, price, desc, language });
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

    const { id } = req.params;
    const updatedBook = await Book.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedBook) {
      return res.status(404).json({ status: "error", message: "Book not found", data: [] });
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

    const { id } = req.params;
    const deletedBook = await Book.findByIdAndDelete(id);

    if (!deletedBook) {
      return res.status(404).json({ status: "error", message: "Book not found", data: [] });
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
      return res.status(400).json({ status: "error", message: "Search query is required", data: [] });
    }

    const q = query.trim();
    const t = transliterate(q);
    const reQ = new RegExp(q, "i");
    const reT = new RegExp(t, "i");
    const reExactQ = new RegExp(`^${q}$`, "i");
    const reExactT = new RegExp(`^${t}$`, "i");

    const books = await Book.aggregate([
      {
        $match: {
          $or: [
            { title: { $regex: reQ } },
            { author: { $regex: reQ } },
            { language: { $regex: reQ } },
            { title: { $regex: reT } },
            { author: { $regex: reT } },
          ]
        }
      },
      {
        $addFields: {
          score: {
            $switch: {
              branches: [
                { case: { $regexMatch: { input: "$title", regex: reExactQ } }, then: 100 },
                { case: { $regexMatch: { input: "$title", regex: reExactT } }, then: 90 },
                { case: { $regexMatch: { input: "$author", regex: reExactQ } }, then: 80 },
                { case: { $regexMatch: { input: "$author", regex: reExactT } }, then: 70 },
                { case: { $regexMatch: { input: "$title", regex: reQ } }, then: 60 },
                { case: { $regexMatch: { input: "$title", regex: reT } }, then: 50 },
                { case: { $regexMatch: { input: "$author", regex: reQ } }, then: 40 },
                { case: { $regexMatch: { input: "$author", regex: reT } }, then: 30 },
                { case: { $regexMatch: { input: "$language", regex: reQ } }, then: 20 },
              ],
              default: 0
            }
          }
        }
      },
      { $sort: { score: -1, title: 1 } }
    ]);

    res.status(200).json({ status: "success", message: "Books fetched successfully", data: books });
  } catch (error) {
    console.error("Error searching books:", error);
    sendError(res, "Internal Server Error");
  }
});

// 📖 Get Single Book by ID
router.get("/get-book-by-id/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({ status: "error", message: "Book not found", data: [] });
    }

    res.status(200).json({ status: "success", message: "Book fetched successfully", data: book });
  } catch (error) {
    console.error("Error fetching book by ID:", error);
    sendError(res, "Internal Server Error");
  }
});

module.exports = router;
