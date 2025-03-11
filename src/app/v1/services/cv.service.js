const { StatusCodes } = require("http-status-codes");
const db = require("../models");
const { Op } = require("sequelize");
const CommonUtils = require("../../share/utils/common.utils");

const {
  CustomError,
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} = require("../errors/customErrors");

class CVService {
  async caculateMatchCv(file, mapRequired) {
    try {
      let myMapRequired = new Map(mapRequired);
      if (myMapRequired.size === 0) {
        return 0;
      }
      let match = 0;
      let cvData = await CommonUtils.pdfToString(file);
      cvData = cvData.pages;
      cvData.forEach((item) => {
        item.content.forEach((data) => {
          for (let key of myMapRequired.keys()) {
            if (
              CommonUtils.flatAllString(data.str).includes(
                CommonUtils.flatAllString(myMapRequired.get(key))
              )
            ) {
              myMapRequired.delete(key);
              match++;
            }
          }
        });
      });
      return match;
    } catch (error) {
      throw new Error("Error calculating CV match: " + error.message);
    }
  }

  async caculateMatchUserWithFilter(userData, listSkillRequired) {
    try {
      let match = 0;
      let myListSkillRequired = new Map();
      listSkillRequired.forEach((item) => {
        myListSkillRequired.set(item.id, item.name);
      });

      let userskill = await db.UserSkill.findAll({
        where: { userId: userData.userId },
      });

      for (let key of myListSkillRequired.keys()) {
        let temp = [...userskill];
        temp.forEach((item, index) => {
          if (item.SkillId === key) {
            userskill.splice(index, 1);
            match++;
          }
        });
      }

      let matchFromCV = await this.caculateMatchCv(
        userData.file,
        myListSkillRequired
      );
      return match + matchFromCV;
    } catch (error) {
      throw new Error("Error calculating user match: " + error.message);
    }
  }

  getMapRequiredSkill(mapRequired, post) {
    try {
      for (let key of mapRequired.keys()) {
        if (
          !CommonUtils.flatAllString(
            post.postDetailData.descriptionHTML
          ).includes(
            CommonUtils.flatAllString(mapRequired.get(key).toLowerCase())
          )
        ) {
          mapRequired.delete(key);
        }
      }
      return mapRequired;
    } catch (error) {
      throw new Error("Error processing required skills: " + error.message);
    }
  }

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
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "CV failed due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getDetailCvById(data) {
    try {
      // Kiểm tra tham số đầu vào
      if (!data.cvId || !data.roleCode) {
        throw new BadRequestError("Missing required parameters!");
      }

      // Tìm CV theo ID với thông tin user liên quan
      const cv = await db.Cv.findOne({
        where: { id: data.cvId },
        raw: false,
        nest: true,
        include: [
          {
            model: db.User,
            as: "userCvData",
            attributes: {
              exclude: ["userId", "file", "companyId"],
            },
          },
        ],
      });

      // Kiểm tra xem CV có tồn tại không
      if (!cv) {
        throw new NotFoundError(`CV with id ${data.cvId} not found`);
      }

      // Cập nhật isChecked nếu không phải CANDIDATE
      if (data.roleCode !== "CANDIDATE") {
        cv.isChecked = 1;
        await cv.save();
      }

      // Xử lý file nếu có
      if (cv.file) {
        cv.file = Buffer.from(cv.file, "base64").toString("binary");
      }

      return {
        message: "Get CV details successfully",
        data: cv,
      };
    } catch (error) {
      console.error("Error in CVService.getDetailCvById:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to get CV details",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllCvByUserId(data) {
    try {
      // Kiểm tra tham số đầu vào
      if (!data.userId || !data.limit || !data.offset) {
        throw new BadRequestError("Missing required parameters!");
      }

      // Tìm tất cả CV theo userId với phân trang
      const cv = await db.Cv.findAndCountAll({
        where: { userId: data.userId },
        limit: +data.limit, // Chuyển thành số
        offset: +data.offset, // Chuyển thành số
        raw: true,
        nest: true,
        order: [["createdAt", "DESC"]], // Sắp xếp theo ngày tạo giảm dần
        attributes: {
          exclude: ["file"], // Loại bỏ trường file
        },
        include: [
          {
            model: db.Post,
            as: "postCvData",
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
          },
        ],
      });

      return {
        message: "Get all CV by user successfully",
        data: cv.rows, // Danh sách CV
        count: cv.count, // Tổng số CV
      };
    } catch (error) {
      console.error("Error in CVService.getAllCvByUserId:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to get CV list",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllListCvByPost(data) {
    try {
      // Kiểm tra tham số đầu vào
      if (!data.postId || !data.limit || !data.offset) {
        throw new BadRequestError("Missing required parameters!");
      }

      // Tìm tất cả CV theo postId với phân trang
      const cv = await db.Cv.findAndCountAll({
        where: { postId: data.postId },
        limit: +data.limit,
        offset: +data.offset,
        nest: true,
        raw: true,
        include: [
          {
            model: db.User,
            as: "userCvData",
            attributes: {
              exclude: ["userId", "file", "companyId"],
            },
            include: [
              {
                model: db.Account,
                as: "userAccountData",
                attributes: {
                  exclude: ["password"],
                },
              },
            ],
          },
        ],
      });

      // Tìm thông tin bài post
      const postInfo = await db.Post.findOne({
        where: { id: data.postId },
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
        raw: true,
        nest: true,
      });

      if (!postInfo) {
        throw new NotFoundError(`Post with id ${data.postId} not found`);
      }

      // Lấy danh sách kỹ năng theo categoryJobCode
      const listSkills = await db.Skill.findAll({
        where: {
          categoryJobCode: postInfo.postDetailData.jobTypePostData.code,
        },
      });

      // Tạo map kỹ năng yêu cầu
      const mapRequired = new Map();
      listSkills.forEach((item) => {
        mapRequired.set(item.id, item.name);
      });

      // Lọc kỹ năng cần thiết từ mô tả bài post
      this.getMapRequiredSkill(mapRequired, postInfo);

      // Tính tỷ lệ khớp cho từng CV
      for (let i = 0; i < cv.rows.length; i++) {
        const match = await this.caculateMatchCv(cv.rows[i].file, mapRequired);
        cv.rows[i].file =
          Math.round((match / mapRequired.size + Number.EPSILON) * 100) + "%";
      }

      return {
        message: "Get all CV by post successfully",
        data: cv.rows,
        count: cv.count,
      };
    } catch (error) {
      console.error("Error in CVService.getAllListCvByPost:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to get CV list by post",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getStatisticalCv(data) {
    try {
      // Kiểm tra tham số đầu vào
      if (!data.fromDate || !data.toDate || !data.companyId) {
        throw new BadRequestError("Missing required parameters!");
      }

      // Tìm công ty
      const company = await db.Company.findOne({
        where: { id: data.companyId },
      });

      if (!company) {
        throw new NotFoundError(`Company with id ${data.companyId} not found`);
      }

      // Lấy danh sách user của công ty
      let listUserOfCompany = await db.User.findAll({
        where: { companyId: company.id },
        attributes: ["id"],
      });

      listUserOfCompany = listUserOfCompany.map((item) => ({
        userId: item.id,
      }));

      // Lấy danh sách bài post của công ty với phân trang
      const listPost = await db.Post.findAndCountAll({
        where: {
          [Op.and]: [{ [Op.or]: listUserOfCompany }],
        },
        include: [
          {
            model: db.User,
            as: "userPostData",
            attributes: {
              exclude: ["userId"],
            },
          },
          {
            model: db.DetailPost,
            as: "postDetailData",
            attributes: {
              exclude: ["statusCode"],
            },
          },
        ],
        nest: true,
        raw: true,
        limit: +data.limit || 10, // Giá trị mặc định nếu không gửi limit
        offset: +data.offset || 0, // Giá trị mặc định nếu không gửi offset
        order: [["createdAt", "ASC"]],
      });

      // Lấy danh sách postId
      const listPostId = listPost.rows.map((item) => ({
        postId: item.id,
      }));

      // Thống kê CV theo postId trong khoảng thời gian
      const listCv = await db.Cv.findAll({
        where: {
          createdAt: {
            [Op.and]: [
              { [Op.gte]: `${data.fromDate} 00:00:00` },
              { [Op.lte]: `${data.toDate} 23:59:59` },
            ],
          },
          [Op.and]: [{ [Op.or]: listPostId }],
        },
        attributes: [
          "postId",
          [db.sequelize.fn("COUNT", db.sequelize.col("postId")), "total"],
        ],
        group: ["postId"],
      });

      // Gắn số lượng CV vào mỗi post
      listPost.rows = listPost.rows.map((post) => {
        const cvForPost = listCv.find((cv) => cv.postId === post.id);
        return {
          ...post,
          total: cvForPost ? cvForPost.total : 0,
        };
      });

      return {
        message: "Get statistical CV successfully",
        data: listPost.rows,
        count: listPost.count,
      };
    } catch (error) {
      console.error("Error in CVService.getStatisticalCv:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to get CV statistics",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new CVService();
