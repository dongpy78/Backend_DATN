const express = require("express");
const packageCv = require("../controllers/packagecv.controller");
const middlewareController = require("../middlewares/verifyToken.middleware");

const router = express.Router();

router.post("/create-package-cv", packageCv.createNewPackageCv);
router.put("/update-package-cv", packageCv.updatePackageCv);
router.get("/get-package-cv-by-id", packageCv.getPackageCvById);
router.get("/get-all-package-cv", packageCv.getAllPackageCvs);

module.exports = router;
