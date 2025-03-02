const express = require("express");
const uploadController = require("../controllers/upload.controller");

const router = express.Router();

router.post("/upload-image", uploadController.uploadImage);

module.exports = router;
