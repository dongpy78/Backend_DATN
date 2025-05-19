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
      const { page, limit } = req.query;
      const result = await blogService.getAllCategories({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
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
}

module.exports = new BlogController();
