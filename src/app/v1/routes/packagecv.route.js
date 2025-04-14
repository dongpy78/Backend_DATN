const express = require("express");
const packageCv = require("../controllers/packagecv.controller");
const middlewareController = require("../middlewares/verifyToken.middleware");

const router = express.Router();

router.post("/create-package-cv", packageCv.createNewPackageCv);
router.put("/update-package-cv", packageCv.updatePackageCv);
router.get("/get-package-cv-by-id", packageCv.getPackageCvById);
router.get("/get-all-package-cv", packageCv.getAllPackageCvs);
router.get("/get-all-package-cv-select", packageCv.getAllToSelect);
router.get("/get-payment-cv-link", packageCv.getPaymentLink);
router.post("/payment-cv-success", packageCv.handlePaymentSuccess);
router.put("/set-active-package-cv", packageCv.setActiveTypePackage);
router.get("/get-statistical-package-cv", packageCv.getStatisticalPackage);
// router.get("/get-statistical-package-cv", packageCv.getStatisticalPackage);
// router.get("/get-statistical-package-cv", packageCv.getStatisticalPackage);
// router.get("/get-statistical-package-cv", packageCv.getStatisticalPackage);
// router.get("/get-statistical-package-cv", packageCv.getStatisticalPackage);

module.exports = router;
