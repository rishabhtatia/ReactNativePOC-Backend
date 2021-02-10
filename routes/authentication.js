const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
const User = require("../models/user");
const utils = require("../utilities/utils");
const { JWTKEY } = require("../constants//constants");

router.post("/signup", (req, res, next) => {
  const { email = "", password = "", firstname = "", lastname = "" } = req.body;
  bcrypt.hash(password, 10).then((hash) => {
    const user = new User({
      email,
      password: hash,
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
        } else if (err?.message) {
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
});

router.post("/login", async (req, res, next) => {
  const { email = "", password = "" } = req.body;
  if (utils.validateEmail(email) || password?.trim() === "") {
    const err = new Error("Invalid Email/Password supplied");
    err.status = 400;
    next(err);
  }
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(400).json({
      message: "Invalid Email/Password supplied",
    });
  }
  try {
    await bcrypt.compare(password, user.password);
    const token = jwt.sign({ userId: user._id }, JWTKEY);
    res.status(200).send({ token: token, message: "User successfully Logged in" });
  } catch (err) {
    return res.status(400).json({
      message: "Invalid Email/Password supplied",
    });
  }
});

module.exports = router;
