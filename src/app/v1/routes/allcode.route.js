const express = require("express");
const allCodeController = require("../controllers/allcode.controller");
const ValidationMiddleware = require("../middlewares/validation.middleware");
const middlewareControllers = require("../middlewares/verifyToken.middleware");

const router = express.Router();

// Create new allcode
router.post(
  "/create-new-allcode",
  middlewareControllers.verifyTokenAdmin,
  ValidationMiddleware.validateCreateNewAllCode(),
  allCodeController.createNewAllCode
);
router.get("/get-allcode", allCodeController.getAllCode);
router.patch(
  "/update-allcode",
  ValidationMiddleware.validateUpdateAllCode(),
  allCodeController.updateAllCode
);
router.get("/get-detail-allcode", allCodeController.getDetailAllCode);
router.delete("/delete-allcode", allCodeController.deleteAllCode);
router.get("/list-allcodes", allCodeController.getListAllCode);
router.get("/job-types-count", allCodeController.getListJobTypeAndCountPost);
module.exports = router;
