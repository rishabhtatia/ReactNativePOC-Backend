const jwt = require("jsonwebtoken");
const { JWTKEY } = require("../constants/constants");
const User = require("../models/user");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWTKEY);
    const user = await User.findOne({ _id: decoded._id, "tokens.token": token });
    if (!user) {
      throw new Error();
    }
    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Authentication Failed!!",
    });
  }
};
