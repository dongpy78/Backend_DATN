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

  async getPackageById(id) {
    try {
      if (!id) {
        throw new BadRequestError("Missing required parameter: id");
      }

      const packageCv = await db.PackageCv.findOne({
        where: { id },
      });

      if (!packageCv) {
        throw new NotFoundError("Không tìm thấy dữ liệu gói sản phẩm");
      }

      return {
        success: true,
        data: packageCv,
      };
    } catch (error) {
      console.error("Error in getPackageById:", error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        error.message ||
          "Failed to get package post due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  }

  async getAllPackage(data) {
    try {
      // Validate required parameters
      if (!data.limit || !data.offset) {
        throw new BadRequestError(
          "Missing required parameters: limit and offset"
        );
      }

      const options = {
        offset: +data.offset,
        limit: +data.limit,
      };

      // Thêm bộ lọc tìm kiếm nếu có
      if (data.search) {
        options.where = {
          name: { [Op.like]: `%${data.search}%` },
        };
      }

      const packageCvs = await db.PackageCv.findAndCountAll(options);

      return {
        success: true,
        data: packageCvs.rows,
        total: packageCvs.count,
        limit: +data.limit,
        offset: +data.offset,
      };
    } catch (error) {
      console.error("Error in getAllPackage:", error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        error.message || "Failed to get package posts",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  }

  async getAllToSelect() {
    try {
      const packageCvs = await db.PackageCv.findAll();

      return {
        success: true,
        data: packageCvs,
      };
    } catch (error) {
      console.error("Error in getAllToSelect:", error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        error.message ||
          "Failed to get package CVs for selection due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  }

  async getPaymentLink(data) {
    try {
      if (!data.id || !data.amount) {
        throw new BadRequestError("Missing required parameters!");
      }

      const infoItem = await db.PackageCv.findOne({
        where: { id: data.id },
      });

      if (!infoItem) {
        throw new NotFoundError("Package post not found");
      }

      const item = [
        {
          name: `${infoItem.name}`,
          sku: infoItem.id,
          price: infoItem.price,
          currency: "USD",
          quantity: data.amount,
        },
      ];

      const create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: `${process.env.URL_REACT}/admin/paymentCv/success`,
          cancel_url: `${process.env.URL_REACT}/admin/paymentCv/cancel`,
        },
        transactions: [
          {
            item_list: {
              items: item,
            },
            amount: {
              currency: "USD",
              total: +data.amount * infoItem.price,
            },
            description: "This is the payment description.",
          },
        ],
      };

      const payment = await new Promise((resolve, reject) => {
        paypal.payment.create(create_payment_json, (error, payment) => {
          if (error) {
            reject(error);
          } else {
            resolve(payment);
          }
        });
      });

      return {
        errCode: 0,
        link: payment.links[1].href,
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }

      if (error.response) {
        throw new PaymentError(
          error.message || "Paypal payment creation failed"
        );
      }

      throw new Error(error.message || "Internal server error");
    }
  }
}

module.exports = new PackageCvService();
