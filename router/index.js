var express = require("express");
var router = express.Router();
const commonHelper = require("../helper/commonHelper");

router.get("/", (req, res) => {
  res.render("index", { title: "Express" });
});
router.get("/api", async (req, res) => {
  let jsonData = require("../config/userSwagger");
  delete jsonData.host;
  jsonData.host = await commonHelper.getHost(req, res);
  console.log("jsonData.host:  ", jsonData.host);
  return res.status(200).send(jsonData);
});
module.exports = router;
