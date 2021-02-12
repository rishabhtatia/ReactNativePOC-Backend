const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: Buffer,
  },
  language: {
    type: String,
  },
  country: {
    type: String,
  },
  genre: {
    type: String,
  },
  pages: {
    type: String,
  },
});

const Book = mongoose.model("Book", bookSchema);
module.exports = Book;
