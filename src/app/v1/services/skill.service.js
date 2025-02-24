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

class SkillService {
  async createNewSkill(data) {
    try {
      // Kiểm tra kĩ năng có tồn tại
      const existingSkill = await db.Skill.findOne({
        where: { name: data.name, categoryJobCode: data.categoryJobCode },
      });

      // Nếu tồn tại thì báo lỗi
      if (existingSkill) {
        throw new BadRequestError(
          "Skill already exists with this name and category"
        );
      }

      // Tạo mới kỹ năng
      const newSkill = await db.Skill.create({
        name: data.name,
        categoryJobCode: data.categoryJobCode,
      });
      return {
        message: "Created new Skill Successfully",
        data: newSkill,
      };
    } catch (error) {
      console.error("Error in SkillService.createNewSkill:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to create skill due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteSkill(id) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!id) {
        throw new BadRequestError("Skill ID is required");
      }
      // Tìm kỹ năng
      const foundSkill = await db.Skill.findOne({
        where: { id: id },
      });

      if (!foundSkill) {
        throw new NotFoundError("Skill not found");
      }

      // Kiểm tra xem kỹ năng có được sử dụng không
      const isSkillUsed = await db.UserSkill.findOne({
        where: { skillId: id },
      });

      if (isSkillUsed) {
        throw new UnauthorizedError(
          "Cannot delete this skill because it is associated with other data"
        );
      }

      await db.Skill.destroy({
        where: { id: id },
      });

      return {
        message: "Deleted skill successfully",
      };
    } catch (error) {
      console.error("Error in SkillService.deleteSkill:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to delete skill due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateSkill(data) {
    try {
      // Tìm kỹ năng
      const skill = await db.Skill.findOne({
        where: { id: data.id },
      });

      if (!skill) {
        throw new NotFoundError("Skill not found");
      }

      // Kiểm tra trùng lặp (nếu thay đổi name hoặc categoryJobCode)
      if (data.name && data.categoryJobCode) {
        const existingSkill = await db.Skill.findOne({
          where: {
            name: data.name,
            categoryJobCode: data.categoryJobCode,
            id: { [db.Sequelize.Op.ne]: data.id }, // Không trùng với chính nó
          },
        });
        if (existingSkill) {
          throw new BadRequestError(
            "Skill already exists with this name and category"
          );
        }
      }

      // Cập nhật kỹ năng
      const [updatedRows] = await db.Skill.update(
        {
          name: data.name || skill.name,
          categoryJobCode: data.categoryJobCode || skill.categoryJobCode,
        },
        {
          where: { id: data.id },
        }
      );

      if (updatedRows === 0) {
        throw new NotFoundError("Skill not found or no changes made");
      }

      return {
        message: "Updated skill successfully",
        data: {
          id: data.id,
          name: data.name,
          categoryJobCode: data.categoryJobCode,
        },
      };
    } catch (error) {
      console.error("Error in SkillService.updateSkill:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to update skill due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getDetailSkillById(id) {
    try {
      if (!id) {
        throw new BadRequestError("Không tìm thấy thông tin kỹ năng");
      }

      // Lấy chi tiết kỹ năng
      const data = await db.Skill.findOne({
        where: { id: id },
        // Lấy thêm thông tin từ bảng Allcode
        include: [
          {
            model: db.Allcode, // Liên kết với bảng Allcode
            as: "jobTypeSkillData", // Sử dụng alias (bí danh) để lấy dữ liệu liên quan.
            attributes: ["value", "code"], // Chỉ lấy 2 cột value và code
          },
        ],
        nest: true, // Trả về một đối tượng đơn giản (không có các phương thức của Sequelize).
        raw: true, // Giữ nguyên cấu trúc dữ liệu.
      });
      if (!data) {
        throw new NotFoundError("Skill not found");
      }
      return {
        message: "Retrieved skill detail successfully",
        data: data,
      };
    } catch (error) {
      console.error("Error in SkillService.getDetailSkillById:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message ||
          "Failed to get skill detail due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllSkillByJobCode(categoryJobCode) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!categoryJobCode) {
        throw new BadRequestError("Category job code is required");
      }

      // Tạo bộ lọc cho truy vấn
      let objectFilter = {
        include: [
          {
            model: db.Allcode,
            as: "jobTypeSkillData",
            attributes: ["value", "code"],
          },
        ],
        raw: true,
        nest: true,
      };

      // Nếu categoryJobCode không phải "getAll", thêm điều kiện lọc
      if (categoryJobCode !== "getAll") {
        objectFilter.where = {
          categoryJobCode: categoryJobCode,
        };
      }

      // Lấy danh sách kỹ năng
      const skills = await db.Skill.findAll(objectFilter);

      // Kiểm tra xem có dữ liệu trả về không
      if (!skills.length) {
        throw new NotFoundError(
          categoryJobCode === "getAll"
            ? "No skills found"
            : `No skills found for category job code: ${categoryJobCode}`
        );
      }

      return {
        message: "Retrieved skills successfully",
        data: skills,
      };
    } catch (error) {
      console.error("Error in SkillService.getAllSkillByJobCode:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to get skills due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getListSkill(data) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!data.limit || data.offset === undefined) {
        throw new BadRequestError("Limit and offset are required");
      }

      // Chuyển đổi limit và offset sang số nguyên
      const limit = parseInt(data.limit, 10);
      const offset = parseInt(data.offset, 10);

      if (isNaN(limit) || isNaN(offset) || limit <= 0 || offset < 0) {
        throw new BadRequestError(
          "Limit and offset must be valid positive numbers"
        );
      }

      // Tạo bộ lọc cho truy vấn
      let objectFilter = {
        include: [
          {
            model: db.Allcode,
            as: "jobTypeSkillData",
            attributes: ["value", "code"],
          },
        ],
        limit: limit,
        offset: offset,
        raw: true,
        nest: true,
      };

      // Thêm điều kiện tìm kiếm nếu có
      if (data.search) {
        objectFilter.where = {
          name: { [Op.like]: `%${data.search}%` },
        };
      }

      // Thêm điều kiện lọc theo categoryJobCode nếu có
      if (data.categoryJobCode) {
        objectFilter.where = {
          ...objectFilter.where,
          categoryJobCode: data.categoryJobCode,
        };
      }

      // Lấy danh sách kỹ năng với phân trang
      const skills = await db.Skill.findAndCountAll(objectFilter);

      // Kiểm tra xem có dữ liệu trả về không
      if (!skills.rows.length) {
        throw new NotFoundError("No skills found");
      }

      return {
        message: "Retrieved list of skills successfully",
        data: {
          rows: skills.rows,
          count: skills.count,
        },
      };
    } catch (error) {
      console.error("Error in SkillService.getListSkill:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to get skill list due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new SkillService();
