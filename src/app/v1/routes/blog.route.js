const express = require("express");
const blogController = require("../controllers/blog.controller");
const ValidationMiddleware = require("../middlewares/validation.middleware");
const { upload } = require("../middlewares/multer.middleware");
const router = express.Router();

// --- Routes cho danh mục ---
router.post("/create-categories", blogController.createCategory);
router.get("/get-all-categories", blogController.getAllCategories);
router.get("/get-category/:id", blogController.getCategoryById);
router.put("/update-categories/:id", blogController.updateCategory);
router.delete("/delete-categories/:id", blogController.deleteCategory);

module.exports = router;
