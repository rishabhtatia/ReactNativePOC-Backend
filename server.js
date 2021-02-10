const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const postData = require("./routes/postData");
const authentication = require("./routes/authentication");
const book = require("./routes/book");
const User = require("./models/user");
const app = express();
// mongoose.connect(
//   "mongodb+srv://demoapp:demodemo@cluster0.2gpk4.mongodb.net/?w=majority",
//   {
//     dbName: "test",
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   },
//   () => {}
// );
mongoose.connect("mongodb://localhost:27017/test", { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on("connected", () => {
  console.log("Mongodb connected");
});
mongoose.connection.on("error", (err) => {
  console.log("Mongodb error", err);
});
const publicDirectoryPath = path.join(__dirname, "/public");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
multer({
  limits: { fieldSize: 25 * 1024 * 1024 },
});
app.use("/static", express.static(publicDirectoryPath));

app.post("/test", async (req, res) => {
  const user = new User({
    email: req.body.email,
    password: req.body.password,
  });
  try {
    const user = await user.save();
    res.status(201).json({
      message: "User added successfully",
      body: req.body,
    });
  } catch (err) {
    res.status(422).send(err.message);
  }
});

// app.use("/api", postData);
app.use("/api", authentication);
app.use("/api", book);
app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message || "Internal Server Error",
    },
  });
});
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
//b2cac78f-5b29-48c7-b95d-58728d038a4c
//Username:"demoapp",Password:"skr6DRa4Vupd6x40"
