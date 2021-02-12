const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { JWTKEY } = require("../constants//constants");
const { default: validator } = require("validator");
const auth = require("../middleware/auth");
const { route } = require("./postData");

router.get("/me", auth, (req, res, next) => {
  res.status(200).send({ user: req.user });
});

router.post("/signup", (req, res, next) => {
  const { email = "", password = "", firstname = "", lastname = "" } = req.body;
  const user = new User({
    email,
    password,
    firstname,
    lastname,
  });
  user
    .save()
    .then((data) => {
      res.status(201).json({
        message: "User added successfully",
        result: data,
      });
    })
    .catch((err) => {
      console.log(err);
      if (err.code === 11000) {
        return res.status(409).json({
          message: "This email address is already being used",
        });
      } else if (err?._message) {
        return res.status(400).json({
          message: err._message,
        });
      } else {
        return res.status(500).json({
          message: "Internal Server Error",
        });
      }
    });
});

router.post("/login", async (req, res, next) => {
  const { email = "", password = "" } = req.body;
  if (!validator.isEmail(email) || password?.trim() === "") {
    const err = new Error("Invalid Email/Password format");
    err.status = 400;
    next(err);
  }
  // const user = await User.findOne({ email });
  // if (!user) {
  //   return res.status(404).json({
  //     message: "Invalid Email/Password supplied",
  //   });
  // }
  try {
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();
    res.status(200).send({ token: token, user: user, message: "User successfully Logged in" });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      message: "Invalid Email/Password supplied",
    });
  }
});

router.post("/logout", auth, async (req, res, next) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.status(200).send({ message: "Logged Out successfully" });
  } catch (err) {
    res.status(500).send({ message: "Unable to Log out" });
  }
});

module.exports = router;
