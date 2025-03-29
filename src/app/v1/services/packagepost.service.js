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
      // Validate input
      if (!data.id || !data.amount) {
        throw new BadRequestError("Missing required parameters: id and amount");
      }

      // Validate and format URLs
      const baseUrl = process.env.URL_REACT;
      if (!baseUrl) {
        throw new ConfigurationError("Base URL is not configured");
      }

      const returnUrl = `${baseUrl}/admin/payment/success`;
      const cancelUrl = `${baseUrl}/admin/payment/cancel`;

      try {
        new URL(returnUrl);
        new URL(cancelUrl);
      } catch (e) {
        throw new ConfigurationError("Invalid redirect URL format");
      }

      // Get package info
      const infoItem = await db.PackagePost.findOne({
        where: { id: data.id },
      });

      if (!infoItem) {
        throw new NotFoundError("Package post not found");
      }

      // Prepare payment request
      const paymentRequest = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
        transactions: [
          {
            item_list: {
              items: [
                {
                  name: infoItem.name,
                  sku: infoItem.id.toString(),
                  price: infoItem.price.toFixed(2),
                  currency: "USD",
                  quantity: data.amount.toString(),
                },
              ],
            },
            amount: {
              currency: "USD",
              total: (data.amount * infoItem.price).toFixed(2),
            },
            description: "Payment for package post",
          },
        ],
      };

      // Create PayPal payment
      const payment = await new Promise((resolve, reject) => {
        paypal.payment.create(paymentRequest, (error, payment) => {
          error ? reject(new PaymentError(error)) : resolve(payment);
        });
      });

      // Find approval link safely
      const approvalLink = payment.links.find(
        (link) => link.rel === "approval_url"
      );
      if (!approvalLink) {
        throw new PaymentError("No approval link found in PayPal response");
      }

      return {
        success: true,
        paymentLink: approvalLink.href,
        paymentId: payment.id,
      };
    } catch (error) {
      console.error("Payment processing error:", error);

      if (error instanceof CustomError) {
        throw error;
      }

      // Handle PayPal API errors
      if (error.response?.details) {
        const issues = error.response.details
          .map((d) => `${d.field}: ${d.issue}`)
          .join(", ");
        throw new PaymentError(`PayPal validation failed: ${issues}`);
      }

      throw new PaymentError(error.message || "Payment processing failed");
    }
  }
}

module.exports = new PackagePostService();
