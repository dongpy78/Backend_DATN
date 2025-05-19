const db = require("../models");
const { Op, Sequelize } = require("sequelize");

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

  async getAllCategories({ page = 1, limit = 10, search = "" }) {
    try {
      const offset = (page - 1) * limit;
      const where = search
        ? {
            name: {
              [Op.like]: Sequelize.fn("LOWER", `%${search.toLowerCase()}%`),
            },
          }
        : {};
      console.log("Where condition:", where);

      const { count, rows } = await db.BlogCategory.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
      });

      return {
        message: "Retrieved categories successfully",
        data: {
          categories: rows,
          total: count,
          page: parseInt(page),
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

  // --- Quản lý bài viết (BlogPosts) ---
  async createPostIT(data, files, userId) {
    try {
      // Kiểm tra danh mục tồn tại
      const category = await db.BlogCategory.findByPk(data.categoryId);
      if (!category) {
        throw new NotFoundError("Category not found");
      }

      // Kiểm tra trạng thái tồn tại
      if (data.statusCode) {
        const status = await db.Allcode.findOne({
          where: { code: data.statusCode, type: "STATUSBLOG" },
        });
        if (!status) {
          throw new BadRequestError("Invalid status code");
        }
      }

      // Lấy thumbnail từ data (luôn là chuỗi URL hoặc rỗng)
      const thumbnailUrl = data.thumbnail || "";

      // Tạo bài viết mới
      const newPost = await db.BlogPost.create({
        title: data.title,
        contentHTML: data.contentHTML,
        contentMarkDown: data.contentMarkDown,
        thumbnail: thumbnailUrl,
        categoryId: data.categoryId,
        userId,
        statusCode: data.statusCode || "DRAFT",
      });

      // Gắn tags nếu có
      if (data.tags && Array.isArray(data.tags)) {
        const tags = await db.Tag.findAll({
          where: { id: { [Op.in]: data.tags } },
        });

        // Tạo bản ghi PostTag thủ công
        const postTagRecords = tags.map((tag) => ({
          postId: newPost.id,
          tagId: tag.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.PostTag.bulkCreate(postTagRecords);
      }

      return {
        message: "Created new post successfully",
        data: newPost,
      };
    } catch (error) {
      console.error("Error in BlogService.createPostIT:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        error.message || "Failed to create post",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Lấy danh sách tất cả bài viết IT
  async getAllPostsIT({ page = 1, limit = 10, search = "" }) {
    try {
      const offset = (page - 1) * limit;
      const where = search
        ? {
            title: {
              [Op.like]: Sequelize.fn("LOWER", `%${search.toLowerCase()}%`),
            },
          }
        : {};
      console.log("Where condition:", where);

      const { count, rows } = await db.BlogPost.findAndCountAll({
        include: [
          { model: db.BlogCategory, as: "category" },
          { model: db.Tag, as: "tags", through: { attributes: [] } },
          {
            model: db.Allcode,
            as: "status",
            where: { type: "STATUSBLOG" }, // Chỉ lấy Allcode có type = STATUSBLOG
            attributes: ["code", "value"], // Chỉ lấy code và value
          },
        ],
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
      });

      return {
        message: "Retrieved blogIT successfully",
        data: {
          blogs: rows,
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      console.error("Error in BlogService.getAllPostsIT:", error);
      throw new CustomError(
        error.message || "Failed to retrieve posts",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Lấy chi tiết bài viết IT theo ID
  async getPostITById(id) {
    try {
      const post = await db.BlogPost.findByPk(id, {
        include: [
          { model: db.BlogCategory, as: "category" },
          { model: db.Tag, as: "tags", through: { attributes: [] } },
        ],
      });
      if (!post) {
        throw new NotFoundError("Post not found");
      }
      return {
        message: "Retrieved post successfully",
        data: post,
      };
    } catch (error) {
      console.error("Error in BlogService.getPostITById:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        error.message || "Failed to retrieve post",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updatePostIT(id, data, userId) {
    try {
      const post = await db.BlogPost.findByPk(id);
      if (!post) {
        throw new NotFoundError("Post not found");
      }
      if (post.userId !== userId) {
        throw new UnauthorizedError(
          "You are not authorized to update this post"
        );
      }

      // Kiểm tra danh mục tồn tại
      if (data.categoryId) {
        const category = await db.BlogCategory.findByPk(data.categoryId);
        if (!category) {
          throw new NotFoundError("Category not found");
        }
      }

      // Kiểm tra trạng thái nếu có
      if (data.statusCode) {
        const status = await db.Allcode.findOne({
          where: { code: data.statusCode, type: "STATUSBLOG" },
        });
        if (!status) {
          throw new BadRequestError("Invalid status code");
        }
      }

      // Lấy thumbnail từ data (luôn là chuỗi URL hoặc giữ nguyên)
      const thumbnailUrl = data.thumbnail || post.thumbnail;

      // Cập nhật bài viết
      await post.update({
        title: data.title || post.title,
        contentHTML: data.contentHTML || post.contentHTML,
        contentMarkDown: data.contentMarkDown || post.contentMarkDown,
        thumbnail: thumbnailUrl,
        categoryId: data.categoryId || post.categoryId,
        statusCode: data.statusCode || post.statusCode,
      });

      // Cập nhật tags nếu có
      if (data.tags && Array.isArray(data.tags)) {
        const tags = await db.Tag.findAll({
          where: { id: { [Op.in]: data.tags } },
        });

        // Xóa các tag hiện tại
        await db.PostTag.destroy({ where: { postId: post.id } });

        // Tạo bản ghi PostTag mới
        const postTagRecords = tags.map((tag) => ({
          postId: post.id,
          tagId: tag.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.PostTag.bulkCreate(postTagRecords);
      }

      return {
        message: "Updated post successfully",
        data: post,
      };
    } catch (error) {
      console.error("Error in BlogService.updatePostIT:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        error.message || "Failed to update post",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Xóa bài viết IT
  async deletePostIT(id, userId) {
    try {
      const post = await db.BlogPost.findByPk(id);
      if (!post) {
        throw new NotFoundError("Post not found");
      }
      if (post.userId !== userId) {
        throw new UnauthorizedError(
          "You are not authorized to delete this post"
        );
      }

      await post.destroy();
      return {
        message: "Deleted post successfully",
        data: null,
      };
    } catch (error) {
      console.error("Error in BlogService.deletePostIT:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        error.message || "Failed to delete post",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  // --- Quản lý Tags ---
  async createTag(data, userId) {
    try {
      const newTag = await db.Tag.create({
        name: data.name,
        userId, // Gán userId để theo dõi người tạo (tùy chọn)
      });
      return {
        message: "Created new tag successfully",
        data: newTag,
      };
    } catch (error) {
      console.error("Error in BlogService.createTag:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        error.message || "Failed to create tag",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllTags({ page = 1, limit = 10, search = "" }) {
    try {
      const offset = (page - 1) * limit;
      const where = search
        ? {
            name: {
              [Op.like]: Sequelize.fn("LOWER", `%${search.toLowerCase()}%`),
            },
          }
        : {};
      console.log("Where condition:", where);

      const { count, rows } = await db.Tag.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
      });

      return {
        message: "Retrieved tags successfully",
        data: {
          tags: rows,
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      console.error("Error in BlogService.getAllTags:", error);
      throw new CustomError(
        error.message || "Failed to retrieve tags",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getTagById(id) {
    try {
      const tag = await db.Tag.findByPk(id);
      if (!tag) {
        throw new NotFoundError("Tag not found");
      }
      return {
        message: "Retrieved tag successfully",
        data: tag,
      };
    } catch (error) {
      console.error("Error in BlogService.getTagById:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        error.message || "Failed to retrieve tag",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateTag(id, data, userId) {
    try {
      const tag = await db.Tag.findByPk(id);
      if (!tag) {
        throw new NotFoundError("Tag not found");
      }
      if (tag.userId && tag.userId !== userId) {
        throw new UnauthorizedError(
          "You are not authorized to update this tag"
        );
      }

      await tag.update({
        name: data.name || tag.name,
      });

      return {
        message: "Updated tag successfully",
        data: tag,
      };
    } catch (error) {
      console.error("Error in BlogService.updateTag:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        error.message || "Failed to update tag",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteTag(id, userId) {
    try {
      const tag = await db.Tag.findByPk(id);
      if (!tag) {
        throw new NotFoundError("Tag not found");
      }
      if (tag.userId && tag.userId !== userId) {
        throw new UnauthorizedError(
          "You are not authorized to delete this tag"
        );
      }

      await tag.destroy();
      return {
        message: "Deleted tag successfully",
        data: null,
      };
    } catch (error) {
      console.error("Error in BlogService.deleteTag:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        error.message || "Failed to delete tag",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  // --- Quản lý PostTags (Mối quan hệ BlogPost và Tag) ---
  async addTagToPost(postId, tagId, userId) {
    try {
      const post = await db.BlogPost.findByPk(postId);
      if (!post) throw new NotFoundError("Post not found");
      if (post.userId !== userId) throw new UnauthorizedError("Not authorized");

      const tag = await db.Tag.findByPk(tagId);
      if (!tag) throw new NotFoundError("Tag not found");

      // Sử dụng findOrCreate thay vì addTag
      const [postTag, created] = await db.PostTag.findOrCreate({
        where: { postId, tagId },
        defaults: {
          postId,
          tagId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const updatedPost = await db.BlogPost.findByPk(postId, {
        include: [
          {
            model: db.Tag,
            as: "tags",
            through: { attributes: [] },
          },
        ],
      });

      return {
        message: created ? "Added tag to post" : "Tag already exists",
        data: updatedPost,
      };
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  async removeTagFromPost(postId, tagId, userId) {
    try {
      const post = await db.BlogPost.findByPk(postId);
      if (!post) {
        throw new NotFoundError("Post not found");
      }
      if (post.userId !== userId) {
        throw new UnauthorizedError(
          "You are not authorized to modify this post"
        );
      }

      const tag = await db.Tag.findByPk(tagId);
      if (!tag) {
        throw new NotFoundError("Tag not found");
      }

      await post.removeTag(tag);
      await post.reload({
        include: [{ model: db.Tag, as: "tags", through: { attributes: [] } }],
      });

      return {
        message: "Removed tag from post successfully",
        data: post,
      };
    } catch (error) {
      console.error("Error in BlogService.removeTagFromPost:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        error.message || "Failed to remove tag from post",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new BlogService();
