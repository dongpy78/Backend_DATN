const express = require("express");
const packagePost = require("../controllers/packagepost.controller");

const router = express.Router();

router.post("/create-package-post", packagePost.createNewPackagePost);
router.put("/update-package-post", packagePost.updatePackagePost);
router.get("/get-package-by-id", packagePost.getPackagePostById);

module.exports = router;
