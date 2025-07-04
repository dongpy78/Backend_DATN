const express = require("express");
const packagePost = require("../controllers/packagepost.controller");
const middlewareController = require("../middlewares/verifyToken.middleware");

const router = express.Router();

router.post(
  "/create-package-post",
  middlewareController.verifyTokenAdmin,
  packagePost.createNewPackagePost
);
router.put("/update-package-post", packagePost.updatePackagePost);
router.get("/get-package-by-id", packagePost.getPackagePostById);
router.get("/get-all-packages", packagePost.getAllPackagePosts);
router.get("/get-package-by-type", packagePost.getPackageByType);
router.get("/get-payment-link", packagePost.getPaymentLink);
router.post("/payment-success", packagePost.handlePaymentSuccess);
router.put("/set-active-package-post", packagePost.setActiveTypePackage);
router.get("/get-statistical-package", packagePost.getStatisticalPackage);
router.get("/get-history-trade-post", packagePost.getHistoryTrade);
router.get(
  "/get-sum-by-year-post",
  middlewareController.verifyTokenAdmin,
  packagePost.getSumByYear
);

module.exports = router;
