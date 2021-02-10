const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/postdata", async (req, res) => {
  try {
    const resp = await axios.get("https://jsonplaceholder.typicode.com/posts");
    if (resp.data) {
      res.send(resp.data);
    } else throw new Error({ message: "Something Went Wrong!!" });
  } catch (error) {
    _.nodeErrHandler(res, error);
  }
});

module.exports = router;
//b2cac78f-5b29-48c7-b95d-58728d038a4c
