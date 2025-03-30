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

class PackagePostService {
  async createNewPackagePost(data) {
    try {
      // Validate required fields
      if (!data.name || !data.price || !data.value || data.isHot === "") {
        throw new BadRequestError("Missing required parameters");
      }

      // Tạo mới PackagePost
      const packagePost = await db.PackagePost.create({
        name: data.name,
        value: data.value,
        isHot: data.isHot,
        price: data.price,
        isActive: 1,
      });

      // Trả về kết quả
      return {
        message: "Tạo gói sản phẩm thành công",
        data: packagePost,
      };
    } catch (error) {
      console.error("Error in createNewPackagePost:", error);

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

  async updatePackagePost(data) {
    try {
      // Validate required fields
      if (
        !data.id ||
        !data.name ||
        !data.price ||
        !data.value ||
        data.isHot === ""
      ) {
        throw new BadRequestError("Missing required parameters");
      }

      // Find the package post
      const packagePost = await db.PackagePost.findOne({
        where: { id: data.id },
        raw: false,
      });

      if (!packagePost) {
        throw new NotFoundError("Package post not found");
      }

      // Update the package post
      packagePost.name = data.name;
      packagePost.price = data.price;
      packagePost.value = data.value;
      packagePost.isHot = data.isHot;

      await packagePost.save();

      return {
        message: "Cập nhật thành công",
        data: packagePost,
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

      const packagePost = await db.PackagePost.findOne({
        where: { id },
      });

      if (!packagePost) {
        throw new NotFoundError("Không tìm thấy dữ liệu gói sản phẩm");
      }

      return {
        success: true,
        data: packagePost,
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

      const packagePosts = await db.PackagePost.findAndCountAll(options);

      return {
        success: true,
        data: packagePosts.rows,
        total: packagePosts.count,
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

  async getPackageByType(data) {
    try {
      // Validate required parameter
      if (data.isHot === undefined || data.isHot === "") {
        throw new BadRequestError("Missing required parameter: isHot");
      }

      const packagePosts = await db.PackagePost.findAll({
        where: { isHot: data.isHot },
      });

      return {
        success: true,
        data: packagePosts,
        count: packagePosts.length,
      };
    } catch (error) {
      console.error("Error in getPackageByType:", error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        error.message || "Failed to get package posts by type",
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

      const infoItem = await db.PackagePost.findOne({
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
          return_url: `${process.env.URL_REACT}/admin/payment/success`,
          cancel_url: `${process.env.URL_REACT}/admin/payment/cancel`,
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

  async paymentOrderSuccess(data) {
    try {
      // Validate input
      if (!data.PayerID || !data.paymentId || !data.token) {
        throw new BadRequestError("Missing required parameter!");
      }

      // Get package info
      const infoItem = await db.PackagePost.findOne({
        where: { id: data.packageId },
      });

      if (!infoItem) {
        throw new NotFoundError("Package not found");
      }

      // Prepare payment execution
      const execute_payment_json = {
        payer_id: data.PayerID,
        transactions: [
          {
            amount: {
              currency: "USD",
              total: +data.amount * infoItem.price, // Giữ nguyên logic gốc
            },
          },
        ],
      };

      // Execute PayPal payment
      const payment = await new Promise((resolve, reject) => {
        paypal.payment.execute(
          data.paymentId,
          execute_payment_json,
          (error, payment) => {
            if (error) {
              reject(error);
            } else {
              resolve(payment);
            }
          }
        );
      });

      // Create order record
      const orderPackage = await db.OrderPackage.create({
        packagePostId: data.packageId,
        userId: data.userId,
        currentPrice: infoItem.price,
        amount: +data.amount,
      });

      if (orderPackage) {
        // Update company allowances
        const user = await db.User.findOne({
          where: { id: data.userId },
          attributes: {
            exclude: ["userId"], // Giữ nguyên logic gốc
          },
        });

        if (user && user.companyId) {
          const company = await db.Company.findOne({
            where: { id: user.companyId },
            raw: false,
          });

          if (company) {
            if (infoItem.isHot == 0) {
              company.allowPost += +infoItem.value * +data.amount;
            } else {
              company.allowHotPost += +infoItem.value * +data.amount;
            }
            await company.save({ silent: true });
          }
        }
      }

      // Trả về kết quả theo format gốc
      return {
        errCode: 0,
        errMessage: "Hệ thống đã ghi nhận lịch sử mua của bạn",
      };
    } catch (error) {
      console.error("Payment execution error:", error);

      // Xử lý lỗi CustomError
      if (error instanceof CustomError) {
        throw error;
      }

      // Xử lý lỗi PayPal
      if (error.response) {
        throw new PaymentError(
          error.message || "Paypal payment execution failed"
        );
      }

      // Lỗi chung
      throw new Error(error.message || "Internal server error");
    }
  }
}

module.exports = new PackagePostService();
