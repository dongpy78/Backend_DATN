const db = require("../models");
const { Op } = require("sequelize");

const { StatusCodes } = require("http-status-codes");
const {
  CustomError,
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} = require("../errors/customErrors");
const EmailUtil = require("../../share/utils/email.utils");
const { formatImage } = require("../middlewares/multer.middleware");
const cloudinary = require("../../share/configs/cloudinary.config");

class BlogService {
  // --- Quản lý danh mục (BlogCategories) ---
  async createCategory(data) {
    try {
      // Kiểm tra danh mục đã tồn tại
      const existingCategory = await db.BlogCategory.findOne({
        where: { name: data.name },
      });
      if (existingCategory) {
        throw new BadRequestError("Category already exists with this name");
      }

      // Tạo danh mục mới
      const newCategory = await db.BlogCategory.create({
        name: data.name,
        description: data.description,
      });
      return {
        message: "Created new category successfully",
        data: newCategory,
      };
    } catch (error) {
      console.error("Error in BlogService.createCategory:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        error.message || "Failed to create category",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllCategories({ page = 1, limit = 10 }) {
    try {
      const offset = (page - 1) * limit;
      const { count, rows } = await db.BlogCategory.findAndCountAll({
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });
      return {
        message: "Retrieved categories successfully",
        data: {
          categories: rows,
          total: count,
          page,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      console.error("Error in BlogService.getCategories:", error);
      throw new CustomError(
        error.message || "Failed to retrieve categories",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getCategoryById(id) {
    try {
      const category = await db.BlogCategory.findByPk(id);
      if (!category) {
        throw new NotFoundError("Category not found");
      }
      return {
        message: "Retrieved category successfully",
        data: category,
      };
    } catch (error) {
      console.error("Error in BlogService.getCategoryById:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        error.message || "Failed to retrieve category",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateCategory(id, data) {
    try {
      const category = await db.BlogCategory.findByPk(id);
      if (!category) {
        throw new NotFoundError("Category not found");
      }

      // Kiểm tra tên danh mục mới có trùng không
      if (data.name && data.name !== category.name) {
        const existingCategory = await db.BlogCategory.findOne({
          where: { name: data.name },
        });
        if (existingCategory) {
          throw new BadRequestError("Category name already exists");
        }
      }

      await category.update({
        name: data.name || category.name,
        description: data.description || category.description,
      });
      return {
        message: "Updated category successfully",
        data: category,
      };
    } catch (error) {
      console.error("Error in BlogService.updateCategory:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        error.message || "Failed to update category",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteCategory(id) {
    try {
      const category = await db.BlogCategory.findByPk(id);
      if (!category) {
        throw new NotFoundError("Category not found");
      }

      // Kiểm tra xem danh mục có bài viết không
      const postCount = await db.BlogPost.count({
        where: { categoryId: id },
      });
      if (postCount > 0) {
        throw new BadRequestError(
          "Cannot delete category with associated posts"
        );
      }

      await category.destroy();
      return {
        message: "Deleted category successfully",
      };
    } catch (error) {
      console.error("Error in BlogService.deleteCategory:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        error.message || "Failed to delete category",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new BlogService();
