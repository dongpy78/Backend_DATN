const db = require("../models");
const { Op } = require("sequelize");
const paypal = require("paypal-rest-sdk");
const { StatusCodes } = require("http-status-codes");
const {
  CustomError,
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} = require("../errors/customErrors");
require("dotenv").config();
// Cấu hình PayPal
paypal.configure({
  mode: "sandbox",
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
});

class PackageCvService {
  async createNewPackageCv(data) {
    try {
      // Validate required fields
      if (!data.name || !data.price || !data.value) {
        throw new BadRequestError("Missing required parameters");
      }

      // Tạo mới PackagePost
      const packageCv = await db.PackageCv.create({
        name: data.name,
        value: data.value,
        price: data.price,
        isActive: 1,
      });

      // Trả về kết quả
      return {
        message: "Tạo gói sản phẩm thành công",
        data: packageCv,
      };
    } catch (error) {
      console.error("Error in createNewCV:", error);

      // Xử lý các loại lỗi cụ thể
      if (error.name === "SequelizeUniqueConstraintError") {
        throw new BadRequestError("Tên gói sản phẩm đã tồn tại");
      }

      if (error.name === "SequelizeValidationError") {
        throw new BadRequestError(
          error.errors.map((e) => e.message).join(", ")
        );
      }

      if (error instanceof CustomError) {
        throw error;
      }

      // Bọc lỗi không mong muốn
      throw new CustomError(
        error.message ||
          "Failed to create package post due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  }

  async updatePackageCv(data) {
    try {
      // Validate required fields
      if (!data.id || !data.name || !data.price || !data.value) {
        throw new BadRequestError("Missing required parameters");
      }

      // Find the package post
      const packageCv = await db.PackageCv.findOne({
        where: { id: data.id },
        raw: false,
      });

      if (!packageCv) {
        throw new NotFoundError("Package post not found");
      }

      // Update the package post
      packageCv.name = data.name;
      packageCv.price = data.price;
      packageCv.value = data.value;
      packageCv.isHot = data.isHot;

      await packageCv.save();

      return {
        message: "Cập nhật thành công",
        data: packageCv,
      };
    } catch (error) {
      console.error("Error in updatePackagePost:", error);

      // Handle specific error types
      if (error.name === "SequelizeUniqueConstraintError") {
        throw new BadRequestError("Tên gói sản phẩm đã tồn tại");
      }

      if (error.name === "SequelizeValidationError") {
        throw new BadRequestError(
          error.errors.map((e) => e.message).join(", ")
        );
      }

      if (error instanceof CustomError) {
        throw error;
      }

      // Wrap unexpected errors
      throw new CustomError(
        error.message ||
          "Failed to update package post due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  }
}

module.exports = new PackageCvService();
