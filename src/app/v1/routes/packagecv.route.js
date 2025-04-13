const express = require("express");
const packageCv = require("../controllers/packagecv.controller");
const middlewareController = require("../middlewares/verifyToken.middleware");

const router = express.Router();

router.post("/create-package-cv", packageCv.createNewPackageCv);
router.put("/update-package-cv", packageCv.updatePackageCv);

module.exports = router;
