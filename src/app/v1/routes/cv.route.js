const express = require("express");
const cvController = require("../controllers/cv.controller");
const ValidationMiddleware = require("../middlewares/validation.middleware");

const router = express.Router();

// Create CV

router.post(
  "/create-new-cv",
  ValidationMiddleware.validateCreateNewCv(),
  cvController.createNewCV
);

module.exports = router;
