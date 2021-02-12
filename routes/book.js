const express = require("express");
const axios = require("axios");
const multer = require("multer");
const bodyParser = require("body-parser");
const router = express.Router();
const Book = require("../models/book");
const auth = require("../middleware/auth");
const sharp = require("sharp");
const upload = multer({
  limits: {
    fileSize: 15000000,
  },
  // fileFilter(req, file, cb) {
  //   console.log(file.originalname);
  //   // if (!file.originalname.match(/\.(jpg|jpeg|png)/)) {
  //   //   return cb(new Error("Please upload an image"));
  //   // }
  //   cb(undefined, true);
  // },
});

router.get("/post", auth, (req, res, next) => {
  const pageSize = +req.query.pagesize;
  const currentPage = +req.query.page;
  const bookQuery = Book.find();
  let fetchedPosts;
  if (pageSize && currentPage) {
    bookQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);
  }
  bookQuery
    .find()
    .then((documents) => {
      fetchedPosts = documents;
      return Book.countDocuments();
    })
    .then((count) => {
      res.status(200).json({
        message: "Books send successfully!!",
        posts: fetchedPosts,
        maxPosts: count,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Unable to fetch Books", posts: [], maxPosts: 0 });
    });
});

router.get("/post/:id", auth, async (req, res, next) => {
  const id = req.params.id;
  try {
    const book = await Book.findById(id);
    // console.log(book);
    if (!book) {
      return res.status(404).send({ message: "Book Not Found" });
    }
    res.status(200).send({ book: book });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Unable to fetch Books" });
  }
});

router.patch("/updatepost/:id", auth, upload.single("image"), async (req, res, next) => {
  try {
    const id = req?.params?.id;
    console.log(id);
    const { author, title, language, country, genre, pages } = req.body;
    const book = await Book.findByIdAndUpdate(
      id,
      {
        author,
        title,
        image: req?.file?.buffer,
        language,
        country,
        genre,
        pages,
      },
      { new: true, runValidators: true, useFindAndModify: false }
    );
    console.log(book);
    if (!book) {
      return res.status(404).json({ message: "Book Not Found" });
    } else {
      return res.status(200).send({ message: "Book updated successfully" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Unable to update Book" });
  }
});

router.post("/addpost", upload.single("image"), auth, async (req, res, next) => {
  const { author, title, language, country, genre, pages } = req.body;
  let imageFile = req?.file?.buffer;
  if (imageFile) {
    console.log("CONVERTING...");
    imageFile = await new sharp(imageFile).resize({ height: 500, width: 500 }).png().toBuffer();
  }
  const book = new Book({ author, title, image: req?.file?.buffer, language, country, genre, pages });
  book
    .save()
    .then((createdPost) => {
      console.log(createdPost);
      res.status(201).json({
        message: "Book Added successfully!",
        post: {
          id: createdPost._id,
          ...createdPost,
        },
      });
    })
    .catch((err) => {
      console.log(err);
      if (err.code === 11000) {
        return res.status(409).json({
          message: "Duplicate entry",
        });
      } else {
        res.status(400).json({
          message: "Not able to add Book!",
        });
      }
    });
});

router.delete("/post/:id", auth, async (req, res, next) => {
  const id = req.params.id;
  try {
    const book = await Book.findByIdAndDelete(id);
    console.log(book);
    if (!book) {
      return res.status(404).json({ message: "Book Not Found" });
    }
    res.status(200).send({ message: "Book deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Book Not Found" });
  }
});

router.get("/imagepost/:id", async (req, res, next) => {
  const id = req.params.id;
  console.log(id);
  console.log("BOOK");
  try {
    const book = await Book.findById(id);
    // console.log(book);
    res.set("Content-Type", "image/png");
    res.send(book.image);
  } catch (err) {
    console.log(err);
  }
});

// router.post("/addpost", auth, async (req, res, next) => {
//   const { author, title, image, language, country, genre, pages } = req.body;
//   const book = new Book({
//     author,
//     title,
//     image,
//     language,
//     country,
//     genre,
//     pages,
//   });
//   book
//     .save()
//     .then((createdPost) => {
//       res.status(201).json({
//         message: "Post Added successfully!",
//         post: {
//           id: createdPost._id,
//           ...createdPost,
//         },
//       });
//     })
//     .catch((err) => {
//       res.status(400).json({
//         message: "Not able to add Post!",
//       });
//     });
// });

module.exports = router;
