const db = require("../models");
const { Op } = require("sequelize");

const {
  CustomError,
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} = require("../errors/customErrors");

class CVService {
  async createNewCv(data) {
    try {
      // Tạo bản ghi CV trong cơ sở dữ liệu
      const cv = await db.Cv.create({
        userId: data.userId,
        file: data.file,
        postId: data.postId,
        isChecked: 0,
        description: data.description,
      });

      return {
        message: "Create new CV successfully",
        data: cv,
      };
    } catch (error) {
      console.error("Error in CVService.createCv:", error); // Ghi log lỗi chi tiết
      throw new Error(error.message || "Failed to create CV");
    }
  }
}

module.exports = new CVService();
