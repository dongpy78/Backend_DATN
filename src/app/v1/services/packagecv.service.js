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

  async paymentOrderSuccess(data) {
    try {
      // Validate input
      if (
        !data.PayerID ||
        !data.paymentId ||
        !data.token ||
        !data.packageCvId
      ) {
        throw new BadRequestError("Missing required parameter!");
      }

      // Get package info
      const infoItem = await db.PackageCv.findOne({
        where: { id: data.packageCvId },
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
      const orderPackageCv = await db.OrderPackageCV.create({
        packageCvId: data.packageCvId,
        userId: data.userId,
        currentPrice: infoItem.price,
        amount: +data.amount,
      });

      if (orderPackageCv) {
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
            company.allowCv += +infoItem.value * +data.amount;
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

  async setActiveTypePackage(data) {
    try {
      // Validate required fields
      if (!data.id || data.isActive === "") {
        throw new BadRequestError("Missing required parameters!");
      }

      // Find the package post
      const packageCv = await db.PackageCv.findOne({
        where: { id: data.id },
        raw: false,
      });

      if (!packageCv) {
        throw new NotFoundError("Gói sản phẩm không tồn tại");
      }

      // Update isActive status
      packageCv.isActive = data.isActive;
      await packageCv.save();

      // Return result with original logic
      return {
        errCode: 0,
        errMessage:
          data.isActive == 0
            ? "Gói sản phẩm đã ngừng kích hoạt"
            : "Gói sản phẩm đã hoạt động",
      };
    } catch (error) {
      console.error("Error in setActiveTypePackage:", error);

      // Handle specific CustomError cases
      if (error instanceof CustomError) {
        throw error;
      }

      // Wrap unexpected errors
      throw new CustomError(
        error.message ||
          "Failed to set package active status due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  }

  async getStatisticalPackage(data) {
    try {
      if (!data.fromDate || !data.toDate) {
        throw new BadRequestError("Missing required parameters!");
      }

      let filterListPackage = {};
      if (data.limit && data.offset) {
        filterListPackage.limit = +data.limit;
        filterListPackage.offset = +data.offset;
      }

      const listPackage = await db.PackageCv.findAndCountAll(filterListPackage);

      const listOrderPackage = await db.OrderPackageCV.findAll({
        where: {
          createdAt: {
            [Op.and]: [
              { [Op.gte]: `${data.fromDate} 00:00:00` },
              { [Op.lte]: `${data.toDate} 23:59:59` },
            ],
          },
        },
        attributes: [
          "packageCvId",
          [db.sequelize.literal("SUM(amount)"), "count"],
          [db.sequelize.literal("SUM(currentPrice * amount)"), "total"],
        ],
        order: [[db.Sequelize.literal("total"), "DESC"]],
        group: ["packageCvId"],
        nest: true,
        raw: false, // Đảm bảo trả về instance Sequelize
      });

      // Log để debug dữ liệu từ listOrderPackage
      console.log(
        "listOrderPackage:",
        JSON.stringify(listOrderPackage, null, 2)
      );

      // Tính sum, xử lý trường hợp dữ liệu nested
      const sum =
        listOrderPackage.length > 0
          ? listOrderPackage.reduce((prev, curr) => {
              const total = curr.getDataValue("total") || 0; // Lấy total từ Sequelize instance
              return prev + total;
            }, 0)
          : 0;

      const updatedRows = listPackage.rows.map((packageCv) => {
        const order = listOrderPackage.find(
          (order) => order.packageCvId === packageCv.id
        );
        if (order) {
          return {
            ...packageCv.dataValues,
            count: order.getDataValue("count") || 0,
            total: order.getDataValue("total") || 0,
          };
        }
        return {
          ...packageCv.dataValues,
          count: 0,
          total: 0,
        };
      });

      return {
        errCode: 0,
        data: updatedRows,
        count: listPackage.count,
        sum: sum,
      };
    } catch (error) {
      console.error("Error in getStatisticalPackage:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message ||
          "Failed to get package statistics due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  }

  async getHistoryTrade(data) {
    try {
      // Validate required parameters
      if (!data.companyId) {
        throw new BadRequestError("Missing required parameters!");
      }

      // Find company
      const company = await db.Company.findOne({
        where: { id: data.companyId },
      });

      if (!company) {
        throw new NotFoundError("Không tồn tại công ty");
      }

      // Get list of users belonging to the company
      let listUserOfCompany = await db.User.findAll({
        where: { companyId: company.id },
        attributes: ["id"],
      });

      listUserOfCompany = listUserOfCompany.map((item) => ({
        userId: item.id,
      }));

      // Prepare filter object for OrderPackage
      let objectFilter = {
        where: {
          [Op.and]: [{ [Op.or]: listUserOfCompany }],
        },
        order: [["updatedAt", "DESC"]],
        nest: true,
        raw: true,
        include: [
          {
            model: db.User,
            as: "userOrderCvData",
            attributes: {
              exclude: ["userId"],
            },
          },
          { model: db.PackageCv, as: "packageOrderCvData" },
        ],
      };

      // Add pagination if provided
      if (data.limit && data.offset) {
        objectFilter.limit = +data.limit;
        objectFilter.offset = +data.offset;
      }

      // Add date range filter if provided
      if (data.fromDate && data.toDate) {
        objectFilter.where = {
          ...objectFilter.where,
          createdAt: {
            [Op.and]: [
              { [Op.gte]: `${data.fromDate} 00:00:00` },
              { [Op.lte]: `${data.toDate} 23:59:59` },
            ],
          },
        };
      }

      // Fetch order history
      const res = await db.OrderPackageCV.findAndCountAll(objectFilter);

      // Return result
      return {
        errCode: 0,
        data: res.rows,
        count: res.count,
      };
    } catch (error) {
      console.error("Error in getHistoryTrade:", error);

      // Handle specific CustomError cases
      if (error instanceof CustomError) {
        throw error;
      }

      // Wrap unexpected errors
      throw new CustomError(
        error.message ||
          "Failed to get trade history due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR,
        error
      );
    }
  }
}

module.exports = new PackageCvService();
