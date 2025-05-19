const express = require("express");
const blogController = require("../controllers/blog.controller");
const ValidationMiddleware = require("../middlewares/validation.middleware");
const middlewareControllers = require("../middlewares/verifyToken.middleware");

const { upload } = require("../middlewares/multer.middleware");
const router = express.Router();

// --- Routes cho danh mục ---
router.post("/create-categories", blogController.createCategory);
router.get("/get-all-categories", blogController.getAllCategories);
router.get("/get-category/:id", blogController.getCategoryById);
router.put("/update-categories/:id", blogController.updateCategory);
router.delete("/delete-categories/:id", blogController.deleteCategory);

// --- Routes cho bài viết it ---
router.post(
  "/create-post-it",
  upload.fields([{ name: "thumbnail", maxCount: 1 }]),
  middlewareControllers.verifyTokenAdmin,
  blogController.createPostIT
);

router.get("/all-posts-it", blogController.getAllPostsIT);
router.get("/posts-it-by-id/:id", blogController.getPostITById);
router.put(
  "/update-posts-it/:id",
  upload.fields([{ name: "thumbnail", maxCount: 1 }]),
  middlewareControllers.verifyTokenAdmin,
  blogController.updatePostIT
);

router.delete(
  "/delete-posts-it/:id",
  middlewareControllers.verifyTokenAdmin,
  blogController.deletePostIT
);

// --- Routes cho tags ---
router.post(
  "/create-tags",
  middlewareControllers.verifyTokenAdmin,
  blogController.createTag
);
router.get("/get-all-tags", blogController.getAllTags);
router.get("/get-tag-by-id/:id", blogController.getTagById);
router.put(
  "/update-tag/:id",
  middlewareControllers.verifyTokenAdmin,
  blogController.updateTag
);
router.delete(
  "/delete-tag/:id",
  middlewareControllers.verifyTokenAdmin,
  blogController.deleteTag
);

// --- Routes cho PostTags ---
router.post(
  "/post-tags-it/:postId/tags/:tagId",
  middlewareControllers.verifyTokenAdmin,
  blogController.addTagToPost
);
router.delete(
  "/remove-tags-it/:postId/tags/:tagId",
  middlewareControllers.verifyTokenAdmin,
  blogController.removeTagFromPost
);
module.exports = router;
