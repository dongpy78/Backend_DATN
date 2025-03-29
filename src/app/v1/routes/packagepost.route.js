const express = require("express");
const packagePost = require("../controllers/packagepost.controller");

const router = express.Router();

router.post("/create-package-post", packagePost.createNewPackagePost);
router.put("/update-package-post", packagePost.updatePackagePost);
router.get("/get-package-by-id", packagePost.getPackagePostById);
router.get("/get-all-packages", packagePost.getAllPackagePosts);
router.get("/get-package-by-type", packagePost.getPackageByType);

module.exports = router;
