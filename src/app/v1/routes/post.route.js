const express = require("express");
const postController = require("../controllers/post.controller");
const ValidationMiddleware = require("../middlewares/validation.middleware");

const router = express.Router();

// Create new post
router.post(
  "/create-new-post",
  ValidationMiddleware.validateCreatePostInput(),
  postController.createNewPost
);
router.post(
  "/reup-post",
  ValidationMiddleware.validateReupPostInput(),
  postController.reupPost
);

router.put(
  "/posts/update",
  ValidationMiddleware.validateHandleUpdatePostInput(),
  postController.updatePost
);

router.post("/posts/ban", postController.banPost);
router.post("/posts/active", postController.activePost);
router.post("/posts/accept", postController.acceptPost);
router.get("/posts/list-post", postController.getListPostByAdmin);
router.get("/posts/all-posts", postController.getAllPostByAdmin);
router.get("/posts/detail", postController.getDetailPostById);
router.get("/posts/filter", postController.getFilterPost);
router.get("/posts/statistics", postController.getStatisticalTypePost);
router.get("/posts/notes", postController.getListNoteByPost);
module.exports = router;
