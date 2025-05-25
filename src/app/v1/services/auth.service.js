const db = require("../models");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const PassWordUtils = require("../../share/utils/password.utils");
const TokenUtil = require("../../share/utils/token.utils");
const tokenConfig = require("../../share/configs/token.config");
const EmailUtil = require("../../share/utils/email.utils");

const { upload, formatImage } = require("../middlewares/multer.middleware");
const cloudinary = require("../../share/configs/cloudinary.config");

const {
  CustomError,
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} = require("../errors/customErrors");
const {
  getResetPasswordTemplate,
} = require("../../share/utils/emailTemplate.utils");
const AuthConstants = require("../../share/constants/auth.constant");
const { StatusCodes } = require("http-status-codes");

class AuthService {
  async register(req) {
    try {
      // Xử lý file upload với multer
      await new Promise((resolve, reject) => {
        upload.single("image")(req, req.res, (err) => {
          if (err)
            reject(new BadRequestError("Error uploading file: " + err.message));
          else resolve();
        });
      });

      const data = req.body;
      console.log("Dữ liệu từ req.body:", data);

      // Kiểm tra email hợp lệ
      // if (!data.email) {
      //   throw new BadRequestError("Email không được cung cấp");
      // }

      // Kiểm tra email đã tồn tại trong bảng Account
      const existingAccount = await db.Account.findOne({
        where: { email: data.email },
      });
      if (existingAccount) {
        throw new BadRequestError("Email đã tồn tại");
      }

      // Xóa bản ghi VerificationCode cũ (nếu có)
      await db.VerificationCode.destroy({
        where: { email: data.email },
      });

      // Upload ảnh lên Cloudinary (nếu có)
      let imageUrl = "";
      if (req.file) {
        const uploadedResponse = await cloudinary.uploader.upload(
          req.file.path,
          {
            upload_preset: "dev_setups",
            folder: "user_avatars",
          }
        );
        imageUrl = uploadedResponse.secure_url;
      }

      // Tạo token xác thực email
      const tokenPayload = {
        email: data.email,
        purpose: "verify_email",
      };

      const token = TokenUtil.generateAccessToken({
        payload: tokenPayload,
        secret: tokenConfig.AccessSecret,
        expiresIn: tokenConfig.VerifyEmailExpires,
      });

      // Tạo mật khẩu mặc định nếu không có
      let isHavePass = true;
      if (!data.password) {
        data.password = new Date().getTime().toString();
        isHavePass = false;
      }

      // Lưu dữ liệu vào VerificationCode
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ
      const verificationData = {
        ...data,
        email: data.email, // Đảm bảo email được lưu
        image: imageUrl,
        isHavePass,
      };
      console.log("Dữ liệu lưu vào VerificationCode:", verificationData);

      await db.VerificationCode.create({
        email: data.email,
        token,
        data: verificationData,
        expiresAt,
      });

      // Tạo URL xác thực
      const verificationUrl = `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/auth/verify-email?token=${token}`;

      // const verificationUrl = `${"http://localhost:5173"}/auth/verify-email?token=${token}`;

      // Tạo email xác thực
      const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .button {
              background-color: #4CAF50;
              border: none;
              color: white;
              padding: 10px 20px;
              text-align: center;
              text-decoration: none;
              display: inline-block;
              font-size: 16px;
              margin: 10px 0;
              cursor: pointer;
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <h2>Xác thực email đăng ký</h2>
          <p>Xin chào ${data.firstName} ${data.lastName},</p>
          <p>Vui lòng click vào nút bên dưới để xác thực email của bạn:</p>
          <a href="${verificationUrl}" class="button">Xác thực Email</a>
          <p>Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.</p>
          <p>Link sẽ hết hạn sau 24 giờ.</p>
        </body>
        </html>
      `;

      // Gửi email xác thực
      await EmailUtil.sendEmail({
        to: data.email,
        subject: "Xác thực email đăng ký",
        html: htmlTemplate,
      });

      return {
        message:
          "Verification email sent. Please check your email to complete registration.",
        email: data.email,
      };
    } catch (error) {
      console.error("Error in AuthService.register:", error);
      if (error.name === "SequelizeUniqueConstraintError") {
        throw new BadRequestError(
          "Email đã được sử dụng để đăng ký, vui lòng kiểm tra email xác thực hoặc thử lại sau"
        );
      }
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Registration failed due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async verifyEmail(token) {
    try {
      if (!token) {
        throw new BadRequestError("Token không được cung cấp");
      }

      console.log("Token nhận được:", token);
      const decoded = TokenUtil.verifyToken({
        token,
        secret: tokenConfig.AccessSecret,
      });

      const email = decoded.email;
      console.log("Email từ token:", email);

      if (decoded.purpose !== "verify_email") {
        throw new BadRequestError("Mục đích token không hợp lệ");
      }

      // Lấy dữ liệu từ VerificationCode
      const verificationRecord = await db.VerificationCode.findOne({
        where: { email, token },
      });

      if (!verificationRecord) {
        throw new BadRequestError(
          "Dữ liệu đăng ký đã hết hạn hoặc không tìm thấy"
        );
      }

      // Kiểm tra expiresAt
      if (new Date() > verificationRecord.expiresAt) {
        await verificationRecord.destroy();
        throw new BadRequestError("Token xác thực đã hết hạn");
      }

      // Parse dữ liệu JSON nếu cần
      let tempData = verificationRecord.data;
      if (typeof tempData === "string") {
        tempData = JSON.parse(tempData);
      }
      console.log("tempData sau khi parse:", tempData);

      if (tempData.email !== email) {
        console.log("Email không khớp:", {
          tempDataEmail: tempData.email,
          tokenEmail: email,
        });
        throw new BadRequestError("Dữ liệu đăng ký không hợp lệ");
      }

      // Mã hóa mật khẩu
      const hashPassword = await PassWordUtils.hash({
        password: tempData.password,
      });

      // Tạo bản ghi User
      const user = await db.User.create({
        firstName: tempData.firstName,
        lastName: tempData.lastName,
        address: tempData.address || null,
        genderCode: tempData.genderCode || null,
        phonenumber: tempData.phonenumber || null,
        image: tempData.image || "",
        dob: tempData.dob || null,
        companyId: tempData.companyId || null,
      });

      // Tạo bản ghi Account
      await db.Account.create({
        email: tempData.email,
        password: hashPassword,
        roleCode: tempData.roleCode || "USER",
        statusCode: "S1",
        userId: user.id,
      });

      // Gửi email thông báo đăng ký thành công
      const successHtml = `
        <h2>Đăng ký thành công</h2>
        <p>Chúc mừng ${tempData.firstName} ${tempData.lastName},</p>
        <p>Tài khoản của bạn đã được kích hoạt thành công.</p>
        <p>Email: ${tempData.email}</p>
        ${!tempData.isHavePass ? `<p>Mật khẩu: ${tempData.password}</p>` : ""}
        <p>Bạn có thể đăng nhập tại: 
          <a href="${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/login">
            Trang đăng nhập
          </a>
        </p>
      `;

      await EmailUtil.sendEmail({
        to: tempData.email,
        subject: "Đăng ký thành công",
        html: successHtml,
      });

      // Xóa bản ghi VerificationCode
      await verificationRecord.destroy();

      return {
        success: true,
        message:
          "Email đã được xác thực và tài khoản được kích hoạt thành công",
        email: tempData.email,
      };
    } catch (error) {
      console.error("Lỗi xác thực email:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Xác thực email thất bại",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async login(data, res) {
    try {
      // Kiểm tra tài khoản
      const account = await db.Account.findOne({
        where: { email: data.email },
      });

      if (!account) {
        throw new NotFoundError("Account not found");
      }

      // So sánh mật khẩu
      const isValidPassword = await bcrypt.compare(
        data.password,
        account.password
      );
      if (!isValidPassword) {
        throw new UnauthenticatedError("Incorrect password");
      }

      // Kiểm tra trạng thái tài khoản
      if (account.statusCode !== "S1") {
        throw new UnauthorizedError(
          "Your account is not activated or has been locked"
        );
      }

      // Lấy thông tin người dùng
      const user = await db.User.findOne({
        attributes: {
          exclude: ["userId", "file"],
        },
        where: { id: account.userId },
        include: [
          {
            model: db.Account,
            as: "userAccountData",
            attributes: ["email", "roleCode", "statusCode", "createdAt"], // Loại bỏ password
          },
        ],
      });

      if (!user) {
        throw new NotFoundError("User information not found");
      }

      // Tạo payload cho token
      const tokenPayload = {
        userId: user.id,
        email: user.userAccountData.email,
        roleCode: user.userAccountData.roleCode, // Thêm roleCode vào payload
      };

      // Tạo accessToken
      const accessToken = TokenUtil.generateAccessToken({
        payload: tokenPayload,
        secret: tokenConfig.AccessSecret,
        expiresIn: "2h", // Rõ ràng thời gian hết hạn
      });

      // Tạo refreshToken
      const refreshToken = TokenUtil.generateRefreshToken({
        payload: tokenPayload,
        secret: tokenConfig.RefreshSecret,
        expiresIn: "7d", // Thời gian hết hạn 7 ngày
      });

      // Gửi refreshToken qua cookie
      res.cookie(AuthConstants.KeyCookie.RefreshToken, refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      });

      return {
        message: "Login successfully",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          phonenumber: user.phonenumber,
          image: user.image,
          genderCode: user.genderCode,
          email: user.userAccountData.email,
          roleCode: user.userAccountData.roleCode,
          statusCode: user.userAccountData.statusCode,
          createdAt: user.userAccountData.createdAt,
          companyId: user.companyId,
        },
        accessToken,
      };
    } catch (error) {
      console.error("Error in AuthService.login:", error); // Log lỗi chi tiết
      // Nếu lỗi đã là CustomError thì ném lại, nếu không thì mặc định là 500
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Login failed due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateUser(data) {
    console.log("data", data);
    try {
      // Kiểm tra xem có thiếu tham số id không
      if (!data.id) {
        throw new BadRequestError("Missing required parameter: id");
      }

      // Tìm user và account tương ứng
      const user = await db.User.findOne({
        where: { id: data.id },
        raw: false,
        attributes: {
          exclude: ["userId"],
        },
      });

      const account = await db.Account.findOne({
        where: { userId: data.id },
        raw: false,
      });

      // Nếu không tìm thấy user hoặc account
      if (!user || !account) {
        throw new NotFoundError("User not found");
      }

      // Cập nhật thông tin user
      user.firstName = data.firstName || user.firstName;
      user.lastName = data.lastName || user.lastName;
      user.address = data.address || user.address;
      user.genderCode = data.genderCode || user.genderCode;
      user.dob = data.dob || user.dob;
      user.email = data.email || user.email;
      user.image = data.image || user.image;

      // Lưu thông tin user đã cập nhật
      await user.save();

      // Cập nhật roleCode của account nếu có
      if (data.roleCode) {
        account.roleCode = data.roleCode;
        await account.save();
      }

      // Trả về thông tin user đã cập nhật
      const updatedUser = {
        address: user.address,
        companyId: user.companyId,
        dob: user.dob,
        email: user.email,
        firstName: user.firstName,
        genderCode: user.genderCode,
        id: user.id,
        image: user.image,
        lastName: user.lastName,
        roleCode: account.roleCode,
      };

      return {
        success: true,
        message: "User updated successfully",
        user: updatedUser,
      };
    } catch (error) {
      console.error("Error details:", error);
      // Nếu có lỗi, ném ra CustomError
      if (error instanceof CustomError) {
        throw error;
      }
      // Nếu lỗi không phải là CustomError, ném ra lỗi mặc định
      throw new CustomError(
        "An error occurred while updating the user",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async refreshToken(req, res) {
    try {
      // Lấy refreshToken từ cookie
      const refreshToken = req.cookies[AuthConstants.KeyCookie.RefreshToken];
      if (!refreshToken) {
        throw new UnauthenticatedError("No refresh token provided");
      }

      // Xác minh refreshToken
      const decoded = TokenUtil.verifyToken({
        token: refreshToken,
        secret: tokenConfig.RefreshSecret,
      });

      // Kiểm tra thông tin người dùng từ payload
      const user = await db.User.findOne({
        where: { id: decoded.userId },
        include: [
          {
            model: db.Account,
            as: "userAccountData",
            attributes: ["email", "roleCode", "statusCode"],
          },
        ],
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      if (user.userAccountData.statusCode !== "S1") {
        throw new UnauthorizedError(
          "Your account is not activated or has been locked"
        );
      }

      // Tạo payload cho token mới
      const tokenPayload = {
        userId: user.id,
        email: user.userAccountData.email,
        roleCode: user.userAccountData.roleCode,
      };

      // Tạo accessToken mới
      const accessToken = TokenUtil.generateAccessToken({
        payload: tokenPayload,
        secret: tokenConfig.AccessSecret,
        expiresIn: "1h",
      });

      // Tạo refreshToken mới (tùy chọn)
      const newRefreshToken = TokenUtil.generateRefreshToken({
        payload: tokenPayload,
        secret: tokenConfig.RefreshSecret,
        expiresIn: "7d",
      });

      // Gửi refreshToken mới qua cookie
      res.cookie(AuthConstants.KeyCookie.RefreshToken, newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      });

      return {
        message: "Access token refreshed successfully",
        accessToken,
      };
    } catch (error) {
      console.error("Error in AuthService.refreshToken:", error);
      if (error.name === "TokenExpiredError") {
        throw new UnauthenticatedError("Refresh token has expired");
      }
      if (error.name === "JsonWebTokenError") {
        throw new UnauthenticatedError("Invalid refresh token");
      }
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to refresh token due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async forgotPassword(data) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!data.email) {
        throw new BadRequestError("Please provide an email");
      }

      // Tìm tài khoản theo email
      const account = await db.Account.findOne({
        where: { email: data.email },
      });

      if (!account) {
        throw new NotFoundError("Email not found in the system");
      }

      // Tạo mật khẩu mới ngẫu nhiên và mã hóa
      const newPassword = PassWordUtils.generateRandomPassword();
      const hashPassword = await PassWordUtils.hash({ password: newPassword });

      // Cập nhật mật khẩu
      await account.update({ password: hashPassword });

      // Gửi email với mật khẩu mới
      const emailTemplate = getResetPasswordTemplate(data.email, newPassword);
      await EmailUtil.sendEmail({
        to: data.email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      });

      return {
        message: "Password reset successfully",
      };
    } catch (error) {
      console.error("Error in AuthService.forgotPassword:", error); // Log lỗi chi tiết
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Login failed due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async logout(res) {
    try {
      res.clearCookie(AuthConstants.KeyCookie.RefreshToken);

      return {
        message: "Logout successfully",
      };
    } catch (error) {
      console.error("Error in AuthService.logout:", error); // Log lỗi chi tiết
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Login failed due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async banAccount(userId) {
    try {
      if (!userId) {
        throw new BadRequestError("User ID is required");
      }

      // Tìm thông tin người dùng
      const foundUser = await db.User.findOne({
        where: { id: userId },
        attributes: {
          exclude: ["userId"],
        },
      });

      if (!foundUser) {
        throw new NotFoundError("Account not found for this user");
      }

      // Tìm tài khoản liên kết
      const account = await db.Account.findOne({
        where: { userId: userId },
        raw: false,
      });

      if (!account) {
        throw new NotFoundError("Account not found for this user");
      }

      // Cập nhật trạng thái thành "S2" (banned)
      await account.update({ statusCode: "S2" });

      return {
        message: "Account banned successfully",
      };
    } catch (error) {
      console.error("Error in AuthService.banAccount:", error); // Log lỗi chi tiết
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to ban account due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async unbanAccount(userId) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!userId) {
        throw new BadRequestError("User ID is required");
      }

      // Tìm thông tin người dùng
      const foundUser = await db.User.findOne({
        where: { id: userId },
        attributes: {
          exclude: ["userId"],
        },
      });

      if (!foundUser) {
        throw new NotFoundError("User not found");
      }

      // Tìm tài khoản liên kết
      const account = await db.Account.findOne({
        where: { userId: userId },
        raw: false,
      });

      if (!account) {
        throw new NotFoundError("Account not found for this user");
      }

      // Cập nhật trạng thái thành "S1" (active)
      await account.update({ statusCode: "S1" });

      return {
        message: "Account unbanned successfully",
      };
    } catch (error) {
      console.error("Error in AuthService.unbanAccount:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to unban account due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllUser(data) {
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
        limit: limit,
        offset: offset,
        attributes: {
          exclude: ["password"], // Loại bỏ trường password
        },
        include: [
          {
            model: db.Allcode,
            as: "roleData",
            attributes: ["code", "value"],
          },
          {
            model: db.Allcode,
            as: "statusAccountData",
            attributes: ["code", "value"],
          },
          {
            model: db.User,
            as: "userAccountData",
            attributes: {
              exclude: ["userId"],
            },
            include: [
              {
                model: db.Allcode,
                as: "genderData",
                attributes: ["value", "code"],
              },
            ],
          },
        ],
        raw: true,
        nest: true,
      };

      // Thêm điều kiện tìm kiếm nếu có
      if (data.search) {
        objectFilter.where = {
          email: { [Op.like]: `%${data.search}%` },
        };
      }

      // Lấy danh sách người dùng với phân trang
      const users = await db.Account.findAndCountAll(objectFilter);

      // Kiểm tra xem có dữ liệu trả về không
      if (!users.rows.length) {
        throw new NotFoundError("No users found");
      }

      return {
        message: "Retrieved list of users successfully",
        data: {
          rows: users.rows,
          count: users.count,
        },
      };
    } catch (error) {
      console.error("Error in AuthService.getAllUser:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to get user list due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getDetailUserById(userId) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!userId) {
        throw new BadRequestError("User ID is required");
      }

      // Lấy thông tin tài khoản
      const account = await db.Account.findOne({
        where: { userId: userId, statusCode: "S1" },
        attributes: {
          exclude: ["password"],
        },
        include: [
          {
            model: db.Allcode,
            as: "roleData",
            attributes: ["value", "code"],
          },
          {
            model: db.User,
            as: "userAccountData",
            attributes: {
              exclude: ["userId"],
            },
            include: [
              {
                model: db.Allcode,
                as: "genderData",
                attributes: ["value", "code"],
              },
              {
                model: db.UserSetting,
                as: "userSettingData",
              },
            ],
          },
        ],
        raw: true,
        nest: true,
      });

      // Kiểm tra xem tài khoản có tồn tại không
      if (!account) {
        throw new NotFoundError("User not found or account is not active");
      }

      // Xử lý file nếu có
      // if (account.userAccountData.userSettingData.file) {
      //   account.userAccountData.userSettingData.file = Buffer.from(
      //     account.userAccountData.userSettingData.file,
      //     "base64"
      //   ).toString("binary");
      // }

      // Lấy danh sách kỹ năng của người dùng
      const listSkills = await db.UserSkill.findAll({
        where: { userId: account.userAccountData.id },
        include: [
          {
            model: db.Skill,
            attributes: ["id", "name", "categoryJobCode"],
          },
        ],
        raw: true,
        nest: true,
      });

      // Thêm danh sách kỹ năng vào kết quả
      account.listSkills = listSkills;

      return {
        message: "Retrieved user detail successfully",
        data: account,
      };
    } catch (error) {
      console.error("Error in AuthService.getDetailUserById:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to get user detail due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new AuthService();
