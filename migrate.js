// backend/migrate.js
require("dotenv").config();
const mongoose   = require("mongoose");
//const Sanscript  = require("@indic-transliteration/sanscript");
//require("@indic-transliteration/common_maps")(Sanscript);

const Book       = require("./models/book");

const MONGO_URI = process.env.URI;

async function migrateBooks() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true });
  const books = await Book.find();
  const ops = books.map(b => ({
    updateOne: {
      filter: { _id: b._id },
      update: {
        $set: {
          transliteratedTitle:  Sanscript.t(b.title,  "itrans","beng"),
          transliteratedAuthor: Sanscript.t(b.author, "itrans","beng")
        }
      }
    }
  }));
  if (ops.length) await Book.bulkWrite(ops);
  console.log(`Migrated ${ops.length} documents.`);
  await mongoose.connection.close();
}

migrateBooks();
