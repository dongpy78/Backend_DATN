const db = require("../models");
const { Op } = require("sequelize");
const { StatusCodes } = require("http-status-codes");
const EmailUtil = require("../../share/utils/email.utils");
const {
  CustomError,
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} = require("../errors/customErrors");

class PostService {
  async createNewPost(data) {
    try {
      // Kiểm tra người dùng
      const user = await db.User.findOne({ where: { id: data.userId } });
      if (!user) {
        throw new NotFoundError("Không tìm thấy người dùng");
      }

      // Kiểm tra công ty
      const company = await db.Company.findOne({
        where: { id: user.companyId },
      });
      if (!company) {
        throw new NotFoundError(
          "Bạn chưa có thông tin công ty. Vui lòng thêm công ty trước khi đăng bài tuyển dụng."
        );
      }

      // Kiểm tra trạng thái công ty
      if (company.statusCode !== "S1") {
        throw new UnauthorizedError(
          "Công ty của bạn đã bị khóa và không thể đăng bài"
        );
      }

      // Kiểm tra số lượng bài đăng còn lại
      const allowPostField = data.isHot == "1" ? "allowHotPost" : "allowPost";
      if (company[allowPostField] <= 0) {
        throw new BadRequestError(
          `Công ty của bạn đã hết lượt đăng bài ${
            data.isHot == "1" ? "nổi bật" : "thường"
          }`
        );
      }

      // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
      const transaction = await db.sequelize.transaction();

      try {
        // Trừ số lượng bài đăng còn lại
        company[allowPostField] -= 1;
        await company.save({ silent: true, transaction });

        // Tạo bài viết chi tiết
        const detailPost = await db.DetailPost.create(
          {
            name: data.name,
            descriptionHTML: data.descriptionHTML,
            descriptionMarkdown: data.descriptionMarkdown,
            categoryJobCode: data.categoryJobCode,
            addressCode: data.addressCode,
            salaryJobCode: data.salaryJobCode,
            amount: data.amount,
            categoryJoblevelCode: data.categoryJoblevelCode,
            categoryWorktypeCode: data.categoryWorktypeCode,
            experienceJobCode: data.experienceJobCode,
            genderPostCode: data.genderPostCode,
          },
          { transaction }
        );

        // Tạo bài đăng chính
        await db.Post.create(
          {
            statusCode: "PS3",
            timeEnd: data.timeEnd,
            userId: data.userId,
            isHot: data.isHot,
            detailPostId: detailPost.id,
          },
          { transaction }
        );

        // Commit transaction nếu mọi thứ thành công
        await transaction.commit();

        return {
          message:
            "Đăng bài tuyển dụng thành công, đang chờ duyệt từ quản trị viên",
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error("Error in PostService.createNewPost:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to create post due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async reupPost(data) {
    try {
      // Kiểm tra người dùng
      const user = await db.User.findOne({ where: { id: data.userId } });
      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Kiểm tra công ty
      const company = await db.Company.findOne({
        where: { id: user.companyId },
      });
      if (!company) {
        throw new NotFoundError("Company not found for this user");
      }

      // Kiểm tra bài viết
      const post = await db.Post.findOne({ where: { id: data.postId } });
      if (!post) {
        throw new NotFoundError("Post not found");
      }

      // Kiểm tra số lần đăng bài còn lại
      const allowPostField = post.isHot == "1" ? "allowHotPost" : "allowPost";
      if (company[allowPostField] <= 0) {
        throw new BadRequestError(
          `Your company has no remaining ${
            post.isHot == "1" ? "hot" : "regular"
          } post slots`
        );
      }

      // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
      const transaction = await db.sequelize.transaction();

      try {
        // Cập nhật số lượng bài viết có thể đăng
        company[allowPostField] -= 1;
        await company.save({ transaction });

        // Tạo bài viết mới dựa trên bài cũ
        await db.Post.create(
          {
            statusCode: "PS3",
            timeEnd: data.timeEnd,
            userId: data.userId,
            isHot: post.isHot,
            detailPostId: post.detailPostId,
          },
          { transaction }
        );

        // Commit transaction
        await transaction.commit();

        return {
          message: "Job post re-upped successfully, awaiting admin approval",
        };
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error("Error in handleReupPost:", error);
      return { errCode: 500, errMessage: "Lỗi server, vui lòng thử lại!" };
    }
  }

  async updatePost(data) {
    try {
      // Tìm bài đăng
      const post = await db.Post.findOne({
        where: { id: data.id },
        raw: false,
      });

      if (!post) {
        throw new NotFoundError("Post not found");
      }

      // Kiểm tra xem có bài đăng khác dùng chung detailPostId không
      const otherPost = await db.Post.findOne({
        where: {
          detailPostId: post.detailPostId,
          id: { [Op.ne]: post.id },
        },
      });

      if (otherPost) {
        // Nếu có bài đăng khác dùng chung, tạo mới DetailPost
        const newDetailPost = await db.DetailPost.create({
          name: data.name,
          descriptionHTML: data.descriptionHTML,
          descriptionMarkdown: data.descriptionMarkdown,
          categoryJobCode: data.categoryJobCode,
          addressCode: data.addressCode,
          salaryJobCode: data.salaryJobCode,
          amount: data.amount,
          categoryJoblevelCode: data.categoryJoblevelCode,
          categoryWorktypeCode: data.categoryWorktypeCode,
          experienceJobCode: data.experienceJobCode,
          genderPostCode: data.genderPostCode,
        });
        post.detailPostId = newDetailPost.id;
      } else {
        // Nếu không, cập nhật DetailPost hiện tại
        const detailPost = await db.DetailPost.findOne({
          where: { id: post.detailPostId },
          attributes: {
            exclude: ["statusCode"],
          },
          raw: false,
        });

        if (!detailPost) {
          throw new NotFoundError("DetailPost not found");
        }

        detailPost.name = data.name;
        detailPost.descriptionHTML = data.descriptionHTML;
        detailPost.descriptionMarkdown = data.descriptionMarkdown;
        detailPost.categoryJobCode = data.categoryJobCode;
        detailPost.addressCode = data.addressCode;
        detailPost.salaryJobCode = data.salaryJobCode;
        detailPost.amount = data.amount;
        detailPost.categoryJoblevelCode = data.categoryJoblevelCode;
        detailPost.categoryWorktypeCode = data.categoryWorktypeCode;
        detailPost.experienceJobCode = data.experienceJobCode;
        detailPost.genderPostCode = data.genderPostCode;
        await detailPost.save();
      }

      // Cập nhật bài đăng chính
      post.userId = data.userId;
      post.statusCode = "PS3";
      post.isHot = data.isHot; // Thêm dòng này để cập nhật isHot
      await post.save();

      return {
        message: "Post updated successfully, awaiting admin approval",
      };
    } catch (error) {
      console.error("Error in PostService.handleUpdatePost:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to update post due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async banPost(data) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!data.postId || !data.note || !data.userId) {
        throw new BadRequestError("Post ID, note, and user ID are required");
      }

      // Tìm bài đăng
      const foundPost = await db.Post.findOne({
        where: { id: data.postId },
        raw: false,
      });

      if (!foundPost) {
        throw new NotFoundError("Post not found");
      }

      // Cập nhật trạng thái bài đăng thành PS4 (bị chặn)
      foundPost.statusCode = "PS4";
      await foundPost.save();

      // Tạo ghi chú về lý do chặn
      await db.Note.create({
        postId: foundPost.id,
        note: data.note,
        userId: data.userId,
      });

      // Tìm thông tin người dùng để gửi email
      const user = await db.User.findOne({
        where: { id: foundPost.userId },
        attributes: {
          exclude: ["userId"],
        },
      });

      if (!user) {
        throw new NotFoundError("User not found for this post");
      }

      // Tìm email từ bảng Account (vì email thường nằm ở đây)
      const account = await db.Account.findOne({
        where: { userId: user.id },
      });

      if (!account || !account.email) {
        throw new NotFoundError("Account or email not found for this user");
      }

      const htmlTemplate = `
  <html>
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
        <h2 style="color: #dc3545; text-align: center;">Bài viết của bạn đã bị chặn</h2>
        <p>Bài viết #${foundPost.id} của bạn đã bị chặn vì: ${data.note}</p>
        <a href="admin/list-post/${foundPost.id}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none;">Xem chi tiết</a>
      </div>
    </body>
  </html>
`;
      await EmailUtil.sendEmail({
        to: account.email,
        subject: `Bài viết #${foundPost.id} của bạn đã bị chặn`,
        text: `Bài viết #${foundPost.id} của bạn đã bị chặn vì ${data.note}. Xem chi tiết tại: admin/list-post/${foundPost.id}`,
        html: htmlTemplate,
      });

      return {
        message: "Post banned successfully",
      };
    } catch (error) {
      console.error("Error in PostService.handleBanPost:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to ban post due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async activePost(data) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!data.id || !data.userId || !data.note) {
        throw new BadRequestError("Post ID, user ID, and note are required");
      }

      // Tìm bài đăng
      const foundPost = await db.Post.findOne({
        where: { id: data.id },
        raw: false,
      });

      if (!foundPost) {
        throw new NotFoundError("Post not found");
      }

      // Cập nhật trạng thái bài đăng thành PS3 (chờ duyệt)
      foundPost.statusCode = "PS3";
      await foundPost.save();

      // Tạo ghi chú về lý do mở lại
      await db.Note.create({
        postId: foundPost.id,
        note: data.note,
        userId: data.userId,
      });

      // Tìm thông tin người dùng để gửi email
      const user = await db.User.findOne({
        where: { id: foundPost.userId },
        attributes: {
          exclude: ["userId"],
        },
      });

      if (!user) {
        throw new NotFoundError("User not found for this post");
      }

      // Tìm email từ bảng Account (vì email thường nằm ở đây)
      const account = await db.Account.findOne({
        where: { userId: user.id },
      });

      if (!account || !account.email) {
        throw new NotFoundError("Account or email not found for this user");
      }

      const htmlTemplate = `
  <html>
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
        <h2 style="color: #28a745; text-align: center;">Bài viết của bạn đã được mở lại</h2>
        <p>Bài viết #${foundPost.id} của bạn đã được mở lại vì: ${data.note}</p>
        <a href="admin/list-post/${foundPost.id}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none;">Xem chi tiết</a>
      </div>
    </body>
  </html>
`;
      await EmailUtil.sendEmail({
        to: account.email,
        subject: `Bài viết #${foundPost.id} của bạn đã được mở lại`,
        text: `Bài viết #${foundPost.id} của bạn đã được mở lại vì: ${data.note}. Xem chi tiết tại: admin/list-post/${foundPost.id}`,
        html: htmlTemplate,
      });

      return {
        message: "Post reactivated successfully, awaiting admin approval",
      };
    } catch (error) {
      console.error("Error in PostService.handleActivePost:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to reactivate post due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async acceptPost(data) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!data.id || !data.statusCode) {
        throw new BadRequestError("Post ID and status code are required");
      }

      // Tìm bài đăng
      const foundPost = await db.Post.findOne({
        where: { id: data.id },
        raw: false,
      });

      if (!foundPost) {
        throw new NotFoundError("Post not found");
      }

      // Cập nhật trạng thái bài đăng
      foundPost.statusCode = data.statusCode;
      if (data.statusCode === "PS1") {
        foundPost.timePost = new Date().getTime(); // Thời gian duyệt bài
      }
      await foundPost.save();

      // Lưu ghi chú
      const note =
        data.statusCode === "PS1" ? "Đã duyệt bài thành công" : data.note;
      await db.Note.create({
        postId: foundPost.id,
        note: note,
        userId: data.userId,
      });

      // Tìm thông tin người dùng để gửi email
      const user = await db.User.findOne({
        where: { id: foundPost.userId },
        attributes: {
          exclude: ["userId"],
        },
      });

      if (!user) {
        throw new NotFoundError("User not found for this post");
      }

      // Tìm email từ bảng Account (vì email thường nằm ở đây)
      const account = await db.Account.findOne({
        where: { userId: user.id },
      });

      if (!account || !account.email) {
        throw new NotFoundError("Account or email not found for this user");
      }

      const htmlTemplate = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
            <h2 style="color: ${
              data.statusCode === "PS1" ? "#28a745" : "#dc3545"
            }; text-align: center;">
              ${
                data.statusCode === "PS1"
                  ? "Bài viết của bạn đã được duyệt"
                  : "Bài viết của bạn đã bị từ chối"
              }
            </h2>
            <p>${note}</p>
            <a href="${
              data.statusCode === "PS1"
                ? `detail-job/${foundPost.id}`
                : `admin/list-post/${foundPost.id}`
            }" 
               style="display: inline-block; padding: 10px 20px; background-color: ${
                 data.statusCode === "PS1" ? "#28a745" : "#dc3545"
               }; color: white; text-decoration: none;">
              Xem chi tiết
            </a>
          </div>
        </body>
      </html>
    `;

      // Gửi email thông báo với HTML cho cả hai trường hợp
      await EmailUtil.sendEmail({
        to: account.email,
        subject:
          data.statusCode === "PS1"
            ? "Bài viết của bạn đã được duyệt"
            : `Bài viết #${foundPost.id} của bạn đã bị từ chối`,
        text: `${note}. Xem chi tiết tại: ${
          data.statusCode === "PS1"
            ? `detail-job/${foundPost.id}`
            : `admin/list-post/${foundPost.id}`
        }`,
        html: htmlTemplate, // Thêm html vào cả hai trường hợp
      });

      return {
        message:
          data.statusCode === "PS1"
            ? "Post approved successfully"
            : "Post rejected successfully",
      };
    } catch (error) {
      console.error("Error in PostService.handleAcceptPost:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message ||
          "Failed to process post approval due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getListPostByAdmin(data) {
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

      // Tìm công ty
      const company = await db.Company.findOne({
        where: { id: data.companyId },
      });

      if (!company) {
        throw new NotFoundError("Company not found");
      }

      // Lấy danh sách user của công ty
      const listUserOfCompany = await db.User.findAll({
        where: { companyId: company.id },
        attributes: ["id"],
      });

      const userIds = listUserOfCompany.map((item) => ({
        userId: item.id,
      }));

      // Tạo bộ lọc cho truy vấn bài đăng
      let objectFilter = {
        where: {
          [Op.and]: [{ [Op.or]: userIds }],
        },
        order: [["updatedAt", "DESC"]],
        limit: limit,
        offset: offset,
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
          {
            model: db.Allcode,
            as: "statusPostData",
            attributes: ["value", "code"],
          },
          {
            model: db.User,
            as: "userPostData",
            attributes: {
              exclude: ["userId"],
            },
            include: [
              {
                model: db.Company,
                as: "userCompanyData",
              },
            ],
          },
        ],
      };

      // Thêm điều kiện lọc theo censorCode (statusCode) nếu có
      if (data.censorCode) {
        objectFilter.where = {
          ...objectFilter.where,
          statusCode: data.censorCode,
        };
      }

      // Thêm điều kiện tìm kiếm nếu có
      if (data.search) {
        objectFilter.where = {
          ...objectFilter.where,
          [Op.or]: [
            db.Sequelize.where(db.sequelize.col("postDetailData.name"), {
              [Op.like]: `%${data.search}%`,
            }),
            {
              id: {
                [Op.like]: `%${data.search}%`,
              },
            },
          ],
        };
      }

      // Lấy danh sách bài đăng
      const posts = await db.Post.findAndCountAll(objectFilter);

      // Kiểm tra kết quả
      if (!posts.rows.length) {
        throw new NotFoundError("No posts found for this company");
      }

      return {
        message: "Retrieved list of posts successfully",
        data: {
          rows: posts.rows,
          count: posts.count,
        },
      };
    } catch (error) {
      console.error("Error in PostService.getListPostByAdmin:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to get post list due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllPostByAdmin(data) {
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

      // Tạo bộ lọc cho truy vấn bài đăng
      let objectFilter = {
        order: [["updatedAt", "DESC"]],
        limit: limit,
        offset: offset,
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
          {
            model: db.Allcode,
            as: "statusPostData",
            attributes: ["value", "code"],
          },
          {
            model: db.User,
            as: "userPostData",
            attributes: { exclude: ["userId"] },
            include: [
              {
                model: db.Company,
                as: "userCompanyData",
              },
            ],
          },
        ],
      };

      // Thêm điều kiện lọc theo censorCode (statusCode) nếu có
      if (data.censorCode) {
        objectFilter.where = { statusCode: data.censorCode };
      }

      // Thêm điều kiện tìm kiếm nếu có
      if (data.search) {
        objectFilter.where = {
          ...objectFilter.where,
          [Op.or]: [
            db.Sequelize.where(db.sequelize.col("postDetailData.name"), {
              [Op.like]: `%${data.search}%`,
            }),
            {
              id: {
                [Op.like]: `%${data.search}%`,
              },
            },
            db.Sequelize.where(
              db.sequelize.col("userPostData.userCompanyData.name"),
              {
                [Op.like]: `%${data.search}%`,
              }
            ),
          ],
        };
      }

      // Lấy danh sách bài đăng
      const posts = await db.Post.findAndCountAll(objectFilter);

      // Kiểm tra kết quả
      if (!posts.rows.length) {
        throw new NotFoundError("No posts found");
      }

      return {
        message: "Retrieved list of posts successfully",
        data: {
          rows: posts.rows,
          count: posts.count,
        },
      };
    } catch (error) {
      console.error("Error in PostService.getAllPostByAdmin:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to get post list due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getDetailPostById(id) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!id) {
        throw new BadRequestError("Post ID is required");
      }

      // Tìm bài đăng
      const post = await db.Post.findOne({
        where: { id: id },
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

      // Kiểm tra bài đăng
      if (!post) {
        throw new NotFoundError("Post not found");
      }

      // Tìm thông tin người dùng
      const user = await db.User.findOne({
        where: { id: post.userId },
        attributes: {
          exclude: ["userId"],
        },
      });

      if (!user) {
        throw new NotFoundError("User not found for this post");
      }

      // Tìm thông tin công ty
      const company = await db.Company.findOne({
        where: { id: user.companyId },
      });

      if (!company) {
        throw new NotFoundError("Company not found for this user");
      }

      // Thêm dữ liệu công ty vào bài đăng
      post.companyData = company;

      return {
        message: "Retrieved post detail successfully",
        data: post,
      };
    } catch (error) {
      console.error("Error in PostService.getDetailPostById:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to get post detail due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getFilterPost(data) {
    try {
      // Tạo bộ lọc cho DetailPost
      let detailPostFilter = {
        raw: true,
        nest: true,
        attributes: {
          exclude: ["statusCode"],
        },
      };

      // Xử lý các bộ lọc OR nếu có
      if (
        data.salaryJobCode ||
        data.categoryWorktypeCode ||
        data.experienceJobCode ||
        data.categoryJoblevelCode
      ) {
        const queryConditions = [];

        if (data.salaryJobCode) {
          const salaryJobCodes = data.salaryJobCode.split(",").map((code) => ({
            salaryJobCode: code,
          }));
          queryConditions.push({ [Op.or]: salaryJobCodes });
        }

        if (data.categoryWorktypeCode) {
          const workTypeCodes = data.categoryWorktypeCode
            .split(",")
            .map((code) => ({
              categoryWorktypeCode: code,
            }));
          queryConditions.push({ [Op.or]: workTypeCodes });
        }

        if (data.experienceJobCode) {
          const expTypeCodes = data.experienceJobCode
            .split(",")
            .map((code) => ({
              experienceJobCode: code,
            }));
          queryConditions.push({ [Op.or]: expTypeCodes });
        }

        if (data.categoryJoblevelCode) {
          const jobLevelCodes = data.categoryJoblevelCode
            .split(",")
            .map((code) => ({
              categoryJoblevelCode: code,
            }));
          queryConditions.push({ [Op.or]: jobLevelCodes });
        }

        detailPostFilter.where = {
          [Op.and]: queryConditions,
        };
      }

      // Thêm các điều kiện bổ sung cho DetailPost
      if (data.categoryJobCode) {
        detailPostFilter.where = {
          ...detailPostFilter.where,
          categoryJobCode: data.categoryJobCode,
        };
      }

      if (data.addressCode) {
        detailPostFilter.where = {
          ...detailPostFilter.where,
          addressCode: data.addressCode,
        };
      }

      if (data.search) {
        detailPostFilter.where = {
          ...detailPostFilter.where,
          name: { [Op.like]: `%${data.search}%` },
        };
      }

      // Lấy danh sách DetailPost
      const listDetailPost = await db.DetailPost.findAll(detailPostFilter);

      // Lấy danh sách detailPostId
      const listDetailPostId = listDetailPost.map((item) => ({
        detailPostId: item.id,
      }));

      // Kiểm tra nếu không có DetailPost nào
      if (!listDetailPostId.length) {
        throw new NotFoundError(
          "No matching posts found based on filter criteria"
        );
      }

      // Tạo bộ lọc cho Post
      let postFilter = {
        where: {
          statusCode: "PS1",
          [Op.or]: listDetailPostId,
        },
        order: [["timePost", "DESC"]],
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
          {
            model: db.User,
            as: "userPostData",
            attributes: {
              exclude: ["userId"],
            },
            include: [
              {
                model: db.Company,
                as: "userCompanyData",
              },
            ],
          },
        ],
        raw: true,
        nest: true,
      };

      // Thêm phân trang nếu có
      if (data.limit && data.offset !== undefined) {
        const limit = parseInt(data.limit, 10);
        const offset = parseInt(data.offset, 10);
        if (isNaN(limit) || isNaN(offset) || limit <= 0 || offset < 0) {
          throw new BadRequestError(
            "Limit and offset must be valid positive numbers"
          );
        }
        postFilter.limit = limit;
        postFilter.offset = offset;
      }

      // Thêm điều kiện lọc theo isHot nếu có
      if (data.isHot === "1") {
        postFilter.where = { ...postFilter.where, isHot: data.isHot };
      }

      // Lấy danh sách bài đăng
      const posts = await db.Post.findAndCountAll(postFilter);

      // Kiểm tra kết quả
      if (!posts.rows.length) {
        throw new NotFoundError("No posts found");
      }

      return {
        message: "Retrieved filtered list of posts successfully",
        data: {
          rows: posts.rows,
          count: posts.count,
        },
      };
    } catch (error) {
      console.error("Error in PostService.getFilterPost:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message ||
          "Failed to get filtered post list due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getStatisticalTypePost(data) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!data.limit) {
        throw new BadRequestError("Limit is required");
      }

      const limit = parseInt(data.limit, 10);
      if (isNaN(limit) || limit <= 0) {
        throw new BadRequestError("Limit must be a valid positive number");
      }

      // Lấy thống kê bài đăng theo loại công việc
      const stats = await db.Post.findAll({
        where: {
          statusCode: "PS1", // Chỉ lấy bài đăng đã duyệt
        },
        include: [
          {
            model: db.DetailPost,
            as: "postDetailData",
            attributes: [],
            include: [
              {
                model: db.Allcode,
                as: "jobTypePostData",
                attributes: ["value", "code"],
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
            "amount",
          ],
        ],
        group: ["postDetailData.categoryJobCode"],
        order: [[db.sequelize.literal("amount"), "DESC"]],
        limit: limit,
        raw: true,
        nest: true,
      });

      // Lấy tổng số bài đăng đã duyệt
      const totalPost = await db.Post.findAndCountAll({
        where: {
          statusCode: "PS1",
        },
      });

      // Kiểm tra kết quả
      if (!stats.length) {
        throw new NotFoundError("No statistical data found for approved posts");
      }

      return {
        message: "Retrieved post type statistics successfully",
        data: stats,
        totalPost: totalPost.count,
      };
    } catch (error) {
      console.error("Error in PostService.getStatisticalTypePost:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message ||
          "Failed to get post statistics due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getListNoteByPost(data) {
    try {
      // Kiểm tra dữ liệu đầu vào
      if (!data.id) {
        throw new BadRequestError("Post ID is required");
      }

      if (!data.limit || data.offset === undefined) {
        throw new BadRequestError("Limit and offset are required");
      }

      const limit = parseInt(data.limit, 10);
      const offset = parseInt(data.offset, 10);

      if (isNaN(limit) || isNaN(offset) || limit <= 0 || offset < 0) {
        throw new BadRequestError(
          "Limit and offset must be valid positive numbers"
        );
      }

      // Lấy danh sách ghi chú theo postId
      const notes = await db.Note.findAndCountAll({
        where: { postId: data.id },
        limit: limit,
        offset: offset,
        include: [
          {
            model: db.User,
            as: "userNoteData",
            attributes: {
              exclude: ["userId"],
            },
          },
        ],
        order: [["createdAt", "DESC"]],
        raw: true,
        nest: true,
      });

      // Kiểm tra kết quả
      if (!notes.rows.length) {
        throw new NotFoundError("No notes found for this post");
      }

      return {
        message: "Retrieved list of notes successfully",
        data: {
          rows: notes.rows,
          count: notes.count,
        },
      };
    } catch (error) {
      console.error("Error in PostService.getListNoteByPost:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message ||
          "Failed to get list of notes due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new PostService();
