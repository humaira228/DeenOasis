// backend/models/book.js
const mongoose  = require("mongoose");
//const Sanscript = require("@indic-transliteration/sanscript");
//require("@indic-transliteration/common_maps")(Sanscript);

const bookSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },

  title: {
    type: String,
    required: true,
  },
  // Will store the Bengali script version of the title
  transliteratedTitle: {
    type: String,
  },

  author: {
    type: String,
    required: true,
  },
  // Will store the Bengali script version of the author
  transliteratedAuthor: {
    type: String,
  },

  price: {
    type: Number,
    required: true,
  },

  desc: {
    type: String,
    required: true,
  },

  language: {
    type: String,
    required: true,
  },
}, {
  timestamps: true, // adds createdAt and updatedAt
});

// Pre-save hook: auto-generate the Bengali transliteration for title & author
bookSchema.pre("save", function(next) {
  if (this.title) {
    this.transliteratedTitle = Sanscript.t(this.title, "itrans", "beng");
  }
  if (this.author) {
    this.transliteratedAuthor = Sanscript.t(this.author, "itrans", "beng");
  }
  next();
});

module.exports = mongoose.model("books", bookSchema);
