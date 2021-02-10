const jwt = require("jsonwebtoken");
const { JWTKEY } = require("../constants/constants");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, JWTKEY);
    next();
  } catch (error) {
    res.status(401).json({
      messsage: "Authentication Failed!!",
    });
  }
};
