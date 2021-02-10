const express = require("express");
const axios = require("axios");
const multer = require("multer");
const bodyParser = require("body-parser");
const router = express.Router();
const Book = require("../models/book");
const auth = require("../middleware/auth");
const { route } = require("./authentication");

router.post("/addpost", auth, async (req, res, next) => {
  const { author, title, image, language, country, genre, pages } = req.body;
  const book = new Book({
    author,
    title,
    image,
    language,
    country,
    genre,
    pages,
  });
  book
    .save()
    .then((createdPost) => {
      res.status(201).json({
        message: "Post Added successfully!",
        post: {
          id: createdPost._id,
          ...createdPost,
        },
      });
    })
    .catch((err) => {
      res.status(400).json({
        message: "Not able to add Post!",
      });
    });
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
      return Book.count();
    })
    .then((count) => {
      res.status(200).json({
        message: "Posts send successfully!!",
        posts: fetchedPosts,
        maxPosts: count,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Unable to fetch Posts", posts: [], maxPosts: 0 });
    });
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    console.log(file.originalname);
    // if (!file.originalname.match(/\.(jpg|jpeg|png)/)) {
    //   return cb(new Error("Please upload an image"));
    // }
    cb(undefined, true);
  },
});
router.post(
  "/imagepost",
  upload.single("image"),
  (req, res, next) => {
    const { author, title, language, country, genre, pages } = req.body;
    const book = new Book({ author, title, image: req?.file?.buffer, language, country, genre, pages });
    book
      .save()
      .then((createdPost) => {
        console.log(createdPost);
        res.status(201).json({
          message: "Post Added successfully!",
          post: {
            id: createdPost._id,
            ...createdPost,
          },
        });
      })
      .catch((err) => {
        res.status(400).send({
          message: "Not able to add Post!",
        });
      });
  },
  (error, req, res, next) => {
    console.log(error);
    res.status(400).send({ message: error.message });
  }
);

router.get("/getimagepost/:id", async (req, res, next) => {
  const id = req.params.id;
  try {
    const book = await Book.findById(id);
    console.log(book);
    res.set("Content-Type", "image/jpg");
    res.send(book.image);
  } catch (err) {
    console.log(err);
  }
});

router.get("/getallpost", async (req, res, next) => {
  try {
    const book = await Book.find({});
    console.log(book);
    res.status(200).send(book);
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
