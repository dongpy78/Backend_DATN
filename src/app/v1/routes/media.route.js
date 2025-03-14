const express = require("express");
const mediaController = require("../controllers/media.controller");
const upload = require("../../share/utils/multer.utils");

const router = express.Router();

router.post(
  "/upload/single",
  upload.single("file"),
  mediaController.uploadSingle
);
router.post(
  "/upload/multiple",
  upload.array("files"),
  mediaController.uploadMultiple
);

router.get("/delete-single", mediaController.deleteSingle);
router.get("/detail-media", mediaController.getMedia);

module.exports = router;
