const express = require("express");
const mediaController = require("../controllers/media.controller");
const upload = require("../../share/utils/multer.utils");

const router = express.Router();

router.post(
  "/media/upload/single",
  upload.single("file"),
  mediaController.uploadSingle
);
router.post(
  "/media/upload/multiple",
  upload.array("files"),
  mediaController.uploadMultiple
);

router.get("/media/delete-single", mediaController.deleteSingle);
router.get("/media/detail-media", mediaController.getMedia);

module.exports = router;
