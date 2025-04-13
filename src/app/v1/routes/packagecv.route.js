const express = require("express");
const packageCv = require("../controllers/packagecv.controller");
// const middlewareController = require("../middlewares/verifyToken.middleware");

const router = express.Router();

router.post("/create-package-cv", packageCv.createNewPackageCv);

module.exports = router;
