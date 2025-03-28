const express = require("express");
const packagePost = require("../controllers/packagepost.controller");

const router = express.Router();

router.post("/create-package-post", packagePost.createNewPackagePost);

module.exports = router;
