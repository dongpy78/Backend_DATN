const { StatusCodes } = require("http-status-codes");
const blogService = require("../services/blog.service");

class BlogController {
  async createCategory(req, res, next) {
    try {
      const result = await blogService.createCategory(req.body);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAllCategories(req, res, next) {
    try {
      const { page, limit, search } = req.query;
      console.log("Controller received query:", { page, limit, search }); // Debug
      const result = await blogService.getAllCategories({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search: search || "",
      });
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req, res, next) {
    try {
      const result = await blogService.getCategoryById(req.params.id);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const result = await blogService.updateCategory(req.params.id, req.body);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const result = await blogService.deleteCategory(req.params.id);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  // --- QUẢN LÝ BÀI VIẾT IT ---
  async createPostIT(req, res, next) {
    try {
      const files = {
        thumbnail: req.files && req.files["thumbnail"],
      };
      const userId = req.user.id; // Lấy từ verifyTokenAdmin
      console.log("Received data:", req.body);
      const result = await blogService.createPostIT(req.body, files, userId);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Lấy danh sách tất cả bài viết IT
  async getAllPostsIT(req, res, next) {
    try {
      const result = await blogService.getAllPostsIT();
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Lấy chi tiết bài viết IT theo ID
  async getPostITById(req, res, next) {
    try {
      const result = await blogService.getPostITById(req.params.id);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật bài viết IT
  async updatePostIT(req, res, next) {
    try {
      const files = {
        thumbnail: req.files && req.files["thumbnail"],
      };
      const userId = req.user.id;
      const result = await blogService.updatePostIT(
        req.params.id,
        req.body,
        files,
        userId
      );
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Xóa bài viết IT
  async deletePostIT(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await blogService.deletePostIT(req.params.id, userId);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  // --- QUẢN LÝ TAGS ---
  async createTag(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await blogService.createTag(req.body, userId);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAllTags(req, res, next) {
    try {
      const result = await blogService.getAllTags();
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getTagById(req, res, next) {
    try {
      const result = await blogService.getTagById(req.params.id);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateTag(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await blogService.updateTag(
        req.params.id,
        req.body,
        userId
      );
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteTag(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await blogService.deleteTag(req.params.id, userId);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  // --- QUẢN LÝ POSTTAGS ---
  async addTagToPost(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await blogService.addTagToPost(
        req.params.postId,
        req.params.tagId,
        userId
      );
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async removeTagFromPost(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await blogService.removeTagFromPost(
        req.params.postId,
        req.params.tagId,
        userId
      );
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BlogController();
