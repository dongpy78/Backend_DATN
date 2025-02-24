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
const EmailUtil = require("../../share/utils/email.utils");

class CompanyService {
  async createNewCompany(data) {
    try {
      let thumbnailUrl = "";
      let coverImageUrl = "";

      // Nếu có ảnh đại diện thì lưu ảnh
      if (data.thumbnail) {
        thumbnailUrl = data.thumbnail;
      }

      // Nếu có ảnh bìa thì lưu ảnh
      if (data.coverImage) {
        coverImageUrl = data.coverImage;
      }

      // Tạo mới công ty
      const newCompany = await db.Company.create({
        name: data.name,
        thumbnail: thumbnailUrl,
        coverimage: coverImageUrl,
        descriptionHTML: data.descriptionHTML,
        descriptionMarkdown: data.descriptionMarkdown,
        website: data.website,
        address: data.address,
        phonenumber: data.phonenumber,
        amountEmployer: data.amountEmployer,
        taxnumber: data.taxnumber,
        userId: data.userId,
        statusCode: "S1",
        censorCode: data.file ? "CS3" : "CS2",
        file: data.file ? data.file : null,
      });

      // Tìm user và account liên quan
      const user = await db.User.findOne({
        where: { id: data.userId },
        raw: false,
        attributes: {
          exclude: ["userId"],
        },
      });

      const account = await db.Account.findOne({
        where: { userId: data.userId },
        raw: false,
      });

      if (!user || !account) {
        throw new NotFoundError("User or account not found for this userId");
      }

      // Cập nhật thông tin user và account
      user.companyId = newCompany.id;
      await user.save();
      account.roleCode = "COMPANY";
      await account.save();

      return {
        message: "Created New Company Successfully",
        data: newCompany,
      };
    } catch (error) {
      console.error("Error in CompanyService.createNewCompany:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to create company due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateCompany(data) {
    try {
      // Tìm công ty
      const company = await db.Company.findOne({
        where: { id: data.id },
        raw: false, // Đảm bảo có thể cập nhật trực tiếp
      });

      if (!company) {
        throw new NotFoundError("Company not found");
      }

      if (company.statusCode === "S2") {
        throw new UnauthorizedError("Cannot update a banned company");
      }

      // Kiểm tra tên công ty trùng lặp
      if (data.name) {
        const existingCompany = await db.Company.findOne({
          where: {
            name: data.name,
            id: { [db.Sequelize.Op.ne]: data.id },
          },
        });
        if (existingCompany) {
          throw new BadRequestError("Company name already exists");
        }
      }

      // Kiểm tra số điện thoại trùng lặp
      if (data.phonenumber) {
        const existingPhoneNumber = await db.Company.findOne({
          where: {
            phonenumber: data.phonenumber,
            id: { [db.Sequelize.Op.ne]: data.id },
          },
        });
        if (existingPhoneNumber) {
          throw new BadRequestError("Phone number already exists");
        }
      }

      // Cập nhật thông tin công ty
      await company.update({
        name: data.name || company.name,
        phonenumber: data.phonenumber || company.phonenumber,
        address: data.address || company.address,
        descriptionHTML: data.descriptionHTML || company.descriptionHTML,
        descriptionMarkdown:
          data.descriptionMarkdown || company.descriptionMarkdown,
        amountEmployer: data.amountEmployer || company.amountEmployer,
        website: data.website || company.website,
        taxnumber: data.taxnumber || company.taxnumber,
        thumbnail: data.thumbnail || company.thumbnail,
        coverimage: data.coverImage || company.coverimage,
        file: data.file || company.file,
      });

      return {
        message: "Updated Company Successfully",
        data: company,
      };
    } catch (error) {
      console.error("Error in CompanyService.updateCompany:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to update company due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async banCompany(companyId) {
    try {
      if (!companyId) {
        throw new BadRequestError("Company ID is required");
      }

      const foundCompany = await db.Company.findOne({
        where: { id: companyId },
        raw: false,
      });
      if (!foundCompany) {
        throw new NotFoundError("Company not found");
      }

      await foundCompany.update({ statusCode: "S2" });
      return {
        message: "Banned company successfully",
        data: foundCompany,
      };
    } catch (error) {
      console.error("Error in CompanyService.banCompany:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to ban company due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async unbanCompany(companyId) {
    try {
      if (!companyId) {
        throw new BadRequestError("Company ID is required");
      }

      const foundCompany = await db.Company.findOne({
        where: { id: companyId },
        raw: false,
      });

      if (!foundCompany) {
        throw new Error("Company not found");
      }
      await foundCompany.update({ statusCode: "S1" });

      return {
        message: "Unbanned company successfully",
        data: foundCompany,
      };
    } catch (error) {
      console.error("Error in CompanyService.unbanCompany:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to unban company due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async acceptCompany(data) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!data.companyId) {
        throw new BadRequestError("Company ID is required");
      }

      // Tìm công ty
      const foundCompany = await db.Company.findOne({
        where: { id: data.companyId },
        raw: false,
      });

      if (!foundCompany) {
        throw new NotFoundError("Company not found");
      }

      // Cập nhật trạng thái kiểm duyệt
      const isAccepted = data.note === "null";
      foundCompany.censorCode = isAccepted ? "CS1" : "CS2";
      await foundCompany.save();

      // Lấy thông tin tài khoản thay vì chỉ User
      const account = await db.Account.findOne({
        where: { userId: foundCompany.userId },
        raw: false,
      });

      if (!account || !account.email) {
        throw new NotFoundError("Account or email not found for this company");
      }

      // Chuẩn bị nội dung email
      const note = isAccepted
        ? `Công ty ${foundCompany.name} của bạn đã được kiểm duyệt thành công`
        : data.note;
      const subject = isAccepted
        ? "Công ty của bạn đã được duyệt"
        : "Công ty của bạn bị từ chối duyệt";
      const link = isAccepted
        ? `http://yourdomain.com/detail-company/${foundCompany.id}`
        : "http://yourdomain.com/admin/edit-company";

      // Template HTML cho email
      const htmlTemplate = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
              <h2 style="color: ${
                isAccepted ? "#1098ad" : "#dc3545"
              }; text-align: center;">
                ${subject}
              </h2>
              <p>Xin chào,</p>
              <p>${note}</p>
              <p style="margin: 20px 0;">
                <a 
                  href="${link}" 
                  style="display: inline-block; padding: 10px 20px; background-color: ${
                    isAccepted ? "#28a745" : "#dc3545"
                  }; color: white; text-decoration: none; border-radius: 5px;"
                >
                  ${isAccepted ? "Xem chi tiết công ty" : "Chỉnh sửa thông tin"}
                </a>
              </p>
              <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
              <hr style="border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #777;">
                Đây là email tự động, vui lòng không trả lời trực tiếp. Nếu cần hỗ trợ, liên hệ qua support@yourdomain.com.
              </p>
            </div>
          </body>
        </html>
      `;

      // Gửi email với HTML
      await EmailUtil.sendEmail({
        to: account.email,
        subject: subject,
        text: `${subject}: ${note}\nXem chi tiết tại: ${link}`, // Bản sao lưu plain text
        html: htmlTemplate, // Nội dung HTML đẹp mắt
      });

      return {
        message: isAccepted
          ? "Company approved successfully"
          : "Company returned to pending status",
      };
    } catch (error) {
      console.error("Error in CompanyService.handleAcceptCompany:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message ||
          "Failed to process company approval due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getListCompany(data) {
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
        offset: offset,
        limit: limit,
        where: { statusCode: "S1" }, // Chỉ lấy các công ty đang hoạt động
      };

      // Thêm điều kiện tìm kiếm nếu có
      if (data.search) {
        objectFilter.where = {
          ...objectFilter.where,
          name: { [Op.like]: `%${data.search}%` },
        };
      }

      // Lấy danh sách công ty với phân trang
      const companies = await db.Company.findAndCountAll(objectFilter);

      // Kiểm tra xem có dữ liệu trả về không
      if (!companies.rows.length) {
        throw new NotFoundError("No active companies found");
      }

      return {
        message: "Retrieved list of companies successfully",
        data: {
          rows: companies.rows,
          count: companies.count,
        },
      };
    } catch (error) {
      console.error("Error in CompanyService.getListCompany:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message ||
          "Failed to get company list due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getDetailCompanyById(id) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!id) {
        throw new BadRequestError("Company ID is required");
      }

      // Lấy thông tin công ty
      const company = await db.Company.findOne({
        where: { id: id },
        include: [
          {
            model: db.Allcode,
            as: "censorData",
            attributes: ["value", "code"],
          },
        ],
        nest: true,
        raw: true,
      });

      // Kiểm tra xem công ty có tồn tại không
      if (!company) {
        throw new NotFoundError("Company not found");
      }

      // Lấy danh sách user liên quan đến công ty
      const listUserOfCompany = await db.User.findAll({
        where: { companyId: company.id },
        attributes: ["id"],
      });

      const userIds = listUserOfCompany.map((item) => ({
        userId: item.id,
      }));

      // Lấy danh sách bài đăng của công ty
      company.postData = await db.Post.findAll({
        where: {
          [Op.and]: [{ statusCode: "PS1" }, { [Op.or]: userIds }],
        },
        order: [["createdAt", "DESC"]],
        limit: 5,
        offset: 0,
        attributes: {
          exclude: ["detailPostId"],
        },
        nest: true,
        raw: true,
        include: [
          {
            model: db.DetailPost,
            as: "postDetailData",
            attributes: [
              "id",
              "name",
              "descriptionHTML",
              "descriptionMarkdown",
              "amount",
            ],
            include: [
              {
                model: db.Allcode,
                as: "jobTypePostData",
                attributes: ["value", "code"],
              },
              {
                model: db.Allcode,
                as: "workTypePostData",
                attributes: ["value", "code"],
              },
              {
                model: db.Allcode,
                as: "salaryTypePostData",
                attributes: ["value", "code"],
              },
              {
                model: db.Allcode,
                as: "jobLevelPostData",
                attributes: ["value", "code"],
              },
              {
                model: db.Allcode,
                as: "genderPostData",
                attributes: ["value", "code"],
              },
              {
                model: db.Allcode,
                as: "provincePostData",
                attributes: ["value", "code"],
              },
              {
                model: db.Allcode,
                as: "expTypePostData",
                attributes: ["value", "code"],
              },
            ],
          },
        ],
      });

      // Xử lý file nếu có
      if (company.file) {
        company.file = Buffer.from(company.file, "base64").toString("binary");
      }

      return {
        message: "Retrieved company detail successfully",
        data: company,
      };
    } catch (error) {
      console.error("Error in CompanyService.getDetailCompanyById:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message ||
          "Failed to get company detail due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getDetailCompanyByUserId(data) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!data.userId && !data.companyId) {
        throw new BadRequestError("User ID or Company ID is required");
      }

      let company;

      // Nếu có userId, tìm qua User trước
      if (data.userId && data.userId !== "null") {
        const user = await db.User.findOne({
          where: { id: data.userId },
          attributes: {
            exclude: ["userId"],
          },
        });

        if (!user || !user.companyId) {
          throw new NotFoundError("User not found or user has no company");
        }

        company = await db.Company.findOne({
          where: { id: user.companyId },
        });
      } else if (data.companyId) {
        // Nếu chỉ có companyId, tìm trực tiếp
        company = await db.Company.findOne({
          where: { id: data.companyId },
        });
      }

      // Kiểm tra xem công ty có tồn tại không
      if (!company) {
        throw new NotFoundError("Company not found");
      }

      // Xử lý file nếu có
      if (company.file) {
        company.file = Buffer.from(company.file, "base64").toString("binary");
      }

      return {
        message: "Retrieved company detail successfully",
        data: company,
      };
    } catch (error) {
      console.error("Error in CompanyService.getDetailCompanyByUserId:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message ||
          "Failed to get company detail due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllUserByCompanyId(data) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!data.limit || data.offset === undefined || !data.companyId) {
        throw new BadRequestError("Limit, offset, and company ID are required");
      }

      // Chuyển đổi limit và offset sang số nguyên
      const limit = parseInt(data.limit, 10);
      const offset = parseInt(data.offset, 10);

      if (isNaN(limit) || isNaN(offset) || limit <= 0 || offset < 0) {
        throw new BadRequestError(
          "Limit and offset must be valid positive numbers"
        );
      }

      // Truy vấn danh sách người dùng theo companyId
      const users = await db.User.findAndCountAll({
        where: { companyId: data.companyId },
        limit: limit,
        offset: offset,
        attributes: {
          exclude: ["password", "userId"],
        },
        include: [
          {
            model: db.Allcode,
            as: "genderData",
            attributes: ["value", "code"],
          },
          {
            model: db.Account,
            as: "userAccountData",
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
                model: db.Allcode,
                as: "statusAccountData",
                attributes: ["value", "code"],
              },
            ],
          },
        ],
        raw: true,
        nest: true,
      });

      // Kiểm tra xem có dữ liệu trả về không
      if (!users.rows.length) {
        throw new NotFoundError("No users found for this company");
      }

      return {
        message: "Retrieved list of users successfully",
        data: {
          rows: users.rows,
          count: users.count,
        },
      };
    } catch (error) {
      console.error("Error in CompanyService.getAllUserByCompanyId:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to get user list due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async handleQuitCompany(data) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!data.userId) {
        throw new BadRequestError("User ID is required");
      }

      // Tìm người dùng
      const user = await db.User.findOne({
        where: {
          id: data.userId,
        },
        attributes: {
          exclude: ["userId"],
        },
        raw: false,
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Tìm tài khoản liên quan
      const account = await db.Account.findOne({
        where: { userId: user.id },
        raw: false,
      });

      if (!account) {
        throw new NotFoundError("Account not found for this user");
      }

      // Nếu vai trò là COMPANY, chuyển về EMPLOYER
      if (account.roleCode === "COMPANY") {
        account.roleCode = "EMPLOYER";
        await account.save();
      }

      // Tìm công ty của người dùng
      const company = await db.Company.findOne({
        where: { id: user.companyId },
      });

      if (!company) {
        throw new NotFoundError("Company not found");
      }

      // Cập nhật bài đăng của người dùng sang chủ công ty
      await db.Post.update(
        {
          userId: company.userId,
        },
        {
          where: { userId: user.id },
        }
      );

      // Xóa liên kết công ty khỏi người dùng
      user.companyId = null;
      await user.save();

      return {
        message: "Successfully quit the company",
      };
    } catch (error) {
      console.error("Error in CompanyService.handleQuitCompany:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to quit company due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllCompanyByAdmin(data) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!data.limit || data.offset === "" || data.offset === undefined) {
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
        order: [["updatedAt", "DESC"]],
        limit: limit,
        offset: offset,
        attributes: {
          exclude: ["detailPostId"], // Loại bỏ trường không cần thiết
        },
        nest: true,
        raw: true,
        include: [
          {
            model: db.Allcode,
            as: "statusCompanyData",
            attributes: ["value", "code"],
          },
          {
            model: db.Allcode,
            as: "censorData",
            attributes: ["value", "code"],
          },
        ],
      };

      // Thêm điều kiện tìm kiếm nếu có
      if (data.search) {
        objectFilter.where = {
          [Op.or]: [
            { name: { [Op.like]: `%${data.search}%` } },
            { id: { [Op.like]: `%${data.search}%` } },
          ],
        };
      }

      // Thêm điều kiện lọc theo censorCode nếu có
      if (data.censorCode) {
        objectFilter.where = {
          ...objectFilter.where,
          censorCode: data.censorCode,
        };
      }

      // Lấy danh sách công ty với phân trang
      const companies = await db.Company.findAndCountAll(objectFilter);

      // Kiểm tra xem có dữ liệu trả về không
      if (!companies.rows.length) {
        throw new NotFoundError("No companies found");
      }

      return {
        message: "Retrieved list of companies successfully",
        data: {
          rows: companies.rows,
          count: companies.count,
        },
      };
    } catch (error) {
      console.error("Error in CompanyService.getAllCompanyByAdmin:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message ||
          "Failed to get company list due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new CompanyService();
