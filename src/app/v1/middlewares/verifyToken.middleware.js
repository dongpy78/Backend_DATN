const db = require("../models");
const { StatusCodes } = require("http-status-codes");
const {
  CustomError,
  UnauthenticatedError,
  UnauthorizedError,
  NotFoundError,
} = require("../errors/customErrors");
const TokenUtil = require("../utils/token.utils"); // Đảm bảo đường dẫn đúng
const tokenConfig = require("../config/token.config"); // Đảm bảo đường dẫn đúng

const middlewareControllers = {
  verifyTokenUser: async (req, res, next) => {
    try {
      // Lấy token từ header Authorization
      const token = req.headers.authorization;
      if (!token) {
        throw new UnauthenticatedError("No token provided");
      }

      // Loại bỏ tiền tố "Bearer " nếu có
      const accessToken = TokenUtil.removeBearerPrefix(token);

      // Xác minh token
      const payload = TokenUtil.verifyToken({
        token: accessToken,
        secret: tokenConfig.AccessSecret,
      });

      // Tìm người dùng từ payload
      const user = await db.User.findOne({
        where: { id: payload.userId }, // Dùng userId thay vì sub cho đồng bộ với login
        attributes: {
          exclude: ["userId"],
        },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Gắn thông tin user vào req
      req.user = user;
      next();
    } catch (error) {
      console.error("Error in verifyTokenUser:", error);
      if (error.name === "TokenExpiredError") {
        res.status(StatusCodes.FORBIDDEN).json({
          message: "Token has expired",
          refresh: true,
        });
      } else if (error.name === "JsonWebTokenError") {
        res.status(StatusCodes.FORBIDDEN).json({
          message: "Token is not valid",
          refresh: true,
        });
      } else if (error instanceof CustomError) {
        res.status(error.statusCode).json({
          message: error.message,
          refresh: true,
        });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: "Authentication failed due to an unexpected error",
          refresh: true,
        });
      }
    }
  },

  verifyTokenAdmin: async (req, res, next) => {
    try {
      // Lấy token từ header Authorization
      const token = req.headers.authorization;
      if (!token) {
        throw new UnauthenticatedError("No token provided");
      }

      // Loại bỏ tiền tố "Bearer " nếu có
      const accessToken = TokenUtil.removeBearerPrefix(token);

      // Xác minh token
      const payload = TokenUtil.verifyToken({
        token: accessToken,
        secret: tokenConfig.AccessSecret,
      });

      // Tìm người dùng từ payload với thông tin Account
      const user = await db.User.findOne({
        where: { id: payload.userId }, // Dùng userId thay vì sub
        attributes: {
          exclude: ["userId"],
        },
        include: [
          {
            model: db.Account,
            as: "userAccountData",
            attributes: ["roleCode"],
          },
        ],
        raw: true,
        nest: true,
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Kiểm tra roleCode
      if (user.userAccountData.roleCode !== "ADMIN") {
        throw new UnauthorizedError("Permission denied: Admin access required");
      }

      // Gắn thông tin user vào req
      req.user = user;
      next();
    } catch (error) {
      console.error("Error in verifyTokenAdmin:", error);
      if (error.name === "TokenExpiredError") {
        res.status(StatusCodes.FORBIDDEN).json({
          message: "Token has expired",
          refresh: true,
        });
      } else if (error.name === "JsonWebTokenError") {
        res.status(StatusCodes.FORBIDDEN).json({
          message: "Token is not valid",
          refresh: true,
        });
      } else if (error instanceof CustomError) {
        res.status(error.statusCode).json({
          message: error.message,
          refresh: true,
        });
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: "Authentication failed due to an unexpected error",
          refresh: true,
        });
      }
    }
  },
};

module.exports = middlewareControllers;
