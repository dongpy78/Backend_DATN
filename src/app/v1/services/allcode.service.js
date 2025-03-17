const db = require("../models");
const { Op } = require("sequelize");
const {
  CustomError,
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} = require("../errors/customErrors");
const { StatusCodes } = require("http-status-codes");

class AllCodeService {
  async createNewAllCode(data) {
    try {
      // Tạo mới Allcode
      const allcode = await db.Allcode.create({
        code: data.code,
        type: data.type,
        value: data.value,
        image: data.image,
      });

      // Trả về kết quả
      return { message: "Create new allcode successfully", data: allcode };
    } catch (error) {
      console.error("Error in createNewAllCode", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to create allcode due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllCode(type) {
    try {
      if (!type) {
        throw new BadRequestError("Type is required");
      }

      const allcode = await db.Allcode.findAll({
        where: { type: type },
      });

      // Kiểm tra xem có dữ liệu trả về không
      if (!allcode.length) {
        throw new NotFoundError(`No allcodes found for type: ${type}`);
      }

      return {
        message: "Get allcode successfully",
        data: allcode,
      };
    } catch (error) {
      console.error("Error in AllCodeService.getAllCode:", error); // Log lỗi chi tiết
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to get allcode due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateAllCode(data) {
    try {
      console.log(data);

      // Cập nhật Allcode
      const [updatedRows] = await db.Allcode.update(
        {
          type: data.type,
          value: data.value,
          image: data.image,
        },
        {
          where: { code: data.code },
        }
      );

      // Kiểm tra xem có bản ghi nào được cập nhật không
      if (updatedRows === 0) {
        throw new NotFoundError(`Allcode with code ${data.code} not found`);
      }

      // Trả về kết quả
      return { message: "Update allcode successfully", data: data };
    } catch (error) {
      console.error("Error in AllCodeService.updateAllCode:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to update allcode due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getDetailAllCode(code) {
    try {
      if (!code) {
        throw new BadRequestError("Code is required");
      }

      const allcode = await db.Allcode.findOne({
        where: { code: code },
      });

      if (!allcode) {
        throw new NotFoundError(`Allcode with code ${code} not found`);
      }

      return {
        message: "Get allcode detail successfully",
        data: allcode,
      };
    } catch (error) {
      console.error("Error in AllCodeService.getDetailAllCode:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message ||
          "Failed to get allcode detail due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteAllCode(code) {
    try {
      if (!code) {
        throw new BadRequestError("Code is required");
      }

      const deletedRows = await db.Allcode.destroy({
        where: { code: code },
      });

      if (deletedRows === 0) {
        throw new NotFoundError(`Allcode with code ${code} not found`);
      }

      return {
        message: "Delete allcode successfully",
      };
    } catch (error) {
      console.error("Error in AllCodeService.deleteAllCode:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to delete allcode due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getListAllCode(data) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!data.type || !data.limit || data.offset === undefined) {
        throw new BadRequestError("Type, limit, and offset are required");
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
        where: { type: data.type },
        offset: offset,
        limit: limit,
      };

      // Thêm điều kiện tìm kiếm nếu có
      if (data.search) {
        objectFilter.where.value = { [Op.like]: `%${data.search}%` };
      }

      // Lấy danh sách Allcode với phân trang
      const allcode = await db.Allcode.findAndCountAll(objectFilter);

      // Kiểm tra xem có dữ liệu trả về không
      if (!allcode.rows.length) {
        throw new NotFoundError(`No allcodes found for type: ${data.type}`);
      }

      return {
        message: "Get list of allcodes successfully",
        data: {
          rows: allcode.rows,
          count: allcode.count,
        },
      };
    } catch (error) {
      console.error("Error in AllCodeService.getListAllCode:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message ||
          "Failed to get allcode list due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getListJobTypeAndCountPost(data) {
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

      // Truy vấn danh sách loại công việc và số lượng bài đăng
      const result = await db.Post.findAll({
        where: {
          statusCode: "PS1", // Chỉ lấy bài đăng đã được duyệt
        },
        include: [
          {
            model: db.DetailPost,
            as: "postDetailData",
            attributes: [], // Không lấy cột từ DetailPost
            include: [
              {
                model: db.Allcode,
                as: "jobTypePostData",
                attributes: ["value", "code", "image"], // Lấy thông tin loại công việc
              },
            ],
          },
        ],
        attributes: [
          [
            db.sequelize.fn(
              "COUNT",
              db.sequelize.col("postDetailData.categoryJobCode")
            ),
            "amount", // Đếm số lượng bài đăng theo categoryJobCode
          ],
        ],
        group: ["postDetailData.categoryJobCode"], // Nhóm theo loại công việc
        order: [[db.sequelize.literal("amount"), "DESC"]], // Sắp xếp giảm dần theo số lượng
        limit: limit,
        offset: offset,
        raw: true, // Trả về dữ liệu dạng thô
        nest: true, // Lồng dữ liệu theo cấu trúc
      });

      // Kiểm tra xem có dữ liệu trả về không
      if (!result.length) {
        throw new NotFoundError("No job types with active posts found");
      }

      return {
        message: "Get list of job types and post counts successfully",
        data: result,
      };
    } catch (error) {
      console.error(
        "Error in AllCodeService.getListJobTypeAndCountPost:",
        error
      );
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message ||
          "Failed to get job type list due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new AllCodeService();
