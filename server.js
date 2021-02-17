const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const authentication = require("./routes/authentication");
const book = require("./routes/book");
const User = require("./models/user");
const app = express();
const port = process.env.PORT;
app.listen(port, () => {
  console.log("Server is running on port " + port);
});
// mongoose.connect(
//   "mongodb+srv://demoapp:demodemo@cluster0.2gpk4.mongodb.net/?w=majority",
//   {
//     dbName: "test",
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   },
//   () => {}
// );
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

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
app.use("/static", express.static(publicDirectoryPath));
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
