const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { default: validator } = require("validator");
const auth = require("../middleware/auth");
const { route } = require("./postData");
const { default: axios } = require("axios");

router.get("/me", auth, async (req, res, next) => {
  try {
    console.log("USER");
    res.status(200).send({ user: req.user });
  } catch (e) {
    console.log(e);
    res.status(500).send();
  }
});

router.patch("/me", auth, async (req, res, next) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["firstname", "lastname"];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
  if (!isValidOperation) {
    return res.status(400).send({ message: "Invalid Updates" });
  }
  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.status(200).send({ user: req.user });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete("/me", auth, async (req, res, next) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/signup", (req, res, next) => {
  const { email = "", password = "", firstname = "", lastname = "" } = req.body;
  const user = new User({
    email,
    password,
    firstname,
    lastname,
  });
  if (!validator.isEmail(email) || password?.trim() === "") {
    const err = new Error("Invalid Email/Password format");
    err.status = 400;
    next(err);
  }
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
router.post("/google", async (req, res, next) => {
  const googleToken = req.body.token;
  const { data } = req.body;
  try {
    const profileData = await axios.post(`https://oauth2.googleapis.com/tokeninfo?access_token=${googleToken}`);
    if (!profileData) {
      res.status(404).json({ message: "User not found" });
    } else {
      const user = await User.findByEmailId(profileData?.data?.email);
      if (user) {
        if (user?.googlelogin) {
          const token = await user.generateAuthToken();
          await user.saveAccessToken(googleToken);
          return res.status(200).send({ token: token, user: user, message: "User successfully Logged in" });
        } else {
          return res.status(409).json({
            message: "This email address is already being used",
          });
        }
      } else {
        const user = new User({
          firstname: data?.givenName || "",
          lastname: data.familyName || "",
          email: profileData?.data?.email,
          avatarurl: data?.photoUrl,
          googlelogin: true,
        });
        console.log(user);
        await user.save();
        const token = await user.generateAuthToken();
        await user.saveAccessToken(googleToken);
        res.status(200).send({ token: token, user: user, message: "User successfully Logged in" });
      }
    }
  } catch (err) {
    console.log(err);
    console.log(err?.response?.data);
    res.status(500).json({ message: "Internal server Error" });
  }
});

router.post("/facebook", async (req, res, next) => {
  const facebookToken = req.body.token;
  try {
    const profileData = await axios.get(
      `https://graph.facebook.com/me?access_token=${facebookToken}&fields=id,name,email,picture.height(500)`
    );
    if (!profileData) {
      res.status(404).json({ message: "User not found" });
    } else {
      const user = await User.findByEmailId(profileData?.data?.email);
      if (user) {
        if (user?.facebooklogin) {
          const token = await user.generateAuthToken();
          await user.saveAccessToken(facebookToken);
          return res.status(200).send({ token: token, user: user, message: "User successfully Logged in" });
        } else {
          return res.status(409).json({
            message: "This email address is already being used",
          });
        }
      } else {
        const name = profileData?.data?.name.split(" ");
        const user = new User({
          firstname: name[0] || "",
          lastname: name[1] || "",
          email: profileData?.data?.email,
          avatarurl: profileData?.data?.picture?.data?.url,
          facebooklogin: true,
        });
        await user.save();
        const token = await user.generateAuthToken();
        await user.saveAccessToken(facebookToken);
        res.status(200).send({ token: token, user: user, message: "User successfully Logged in" });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server Error" });
  }
});

router.post("/logoutAll", auth, async (req, res, next) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.status(200).send({ message: "Logged Out successfully" });
  } catch (err) {
    res.status(500).send({ message: "Unable to Log out" });
  }
});

router.post("/logout", auth, async (req, res, next) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    if (req.user.facebooklogin || req.user.googlelogin) {
      req.user.externaltokens = [];
    }
    await req.user.save();
    res.status(200).send({ message: "Logged Out successfully" });
  } catch (err) {
    res.status(500).send({ message: "Unable to Log out" });
  }
});

module.exports = router;
