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
      console.log("CV Data:", cvData);
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
      // return mapRequired;
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

      console.log("POST INFO: ", postInfo);

      if (!postInfo) {
        throw new NotFoundError(`Post with id ${data.postId} not found`);
      }

      // Lấy danh sách kỹ năng theo categoryJobCode
      let listSkills = await db.Skill.findAll({
        where: {
          categoryJobCode: postInfo.postDetailData.jobTypePostData.code,
        },
      });

      console.log("List skill xem thu: ", listSkills);

      // Tạo map kỹ năng yêu cầu
      const mapRequired = new Map();
      listSkills = listSkills.map((item) => {
        mapRequired.set(item.id, item.name);
      });

      console.log("Post Info:", postInfo);

      // Lọc kỹ năng cần thiết từ mô tả bài post
      this.getMapRequiredSkill(mapRequired, postInfo);

      // Tính tỷ lệ khớp cho từng CV
      for (let i = 0; i < cv.rows.length; i++) {
        const match = await this.caculateMatchCv(cv.rows[i].file, mapRequired);

        console.log("Xem file CV la gi: ", cv.rows[i].file);
        console.log("Xem mapRequired la gi: ", mapRequired);
        console.log("Xem mapRequired size la gi: ", mapRequired.size);
        console.log("Xem match la gi? ", match);

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
      // Validate input
      if (!data.fromDate || !data.toDate || !data.companyId) {
        throw new BadRequestError("Missing required parameters!");
      }

      // Find company
      const company = await db.Company.findOne({
        where: { id: data.companyId },
      });

      if (!company) {
        throw new NotFoundError(`Company with id ${data.companyId} not found`);
      }

      // Get all users of company
      const users = await db.User.findAll({
        where: { companyId: company.id },
        attributes: ["id"],
        raw: true,
      });

      // Get all posts of company with pagination
      const posts = await db.Post.findAndCountAll({
        where: {
          userId: {
            [Op.in]: users.map((user) => user.id),
          },
        },
        include: [
          {
            model: db.User,
            as: "userPostData",
            attributes: ["id", "firstName", "lastName"],
          },
          {
            model: db.DetailPost,
            as: "postDetailData",
            attributes: ["id", "name"],
          },
        ],
        limit: +data.limit || 10,
        offset: +data.offset || 0,
        order: [["createdAt", "ASC"]],
        raw: true,
        nest: true,
      });

      // Get CV statistics for each post
      const cvStats = await db.Cv.findAll({
        where: {
          postId: {
            [Op.in]: posts.rows.map((post) => post.id),
          },
          createdAt: {
            [Op.between]: [
              new Date(`${data.fromDate} 00:00:00`),
              new Date(`${data.toDate} 23:59:59`),
            ],
          },
        },
        attributes: [
          "postId",
          [db.sequelize.fn("COUNT", db.sequelize.col("postId")), "total"],
        ],
        group: ["postId"],
        raw: true,
      });

      // Map CV counts to posts
      const result = posts.rows.map((post) => {
        const stat = cvStats.find((stat) => stat.postId === post.id);
        return {
          ...post,
          total: stat ? stat.total : 0,
        };
      });

      return {
        message: "Get statistical CV successfully",
        data: result,
        count: posts.count,
      };
    } catch (error) {
      console.error("Error in getStatisticalCv:", error);

      // Re-throw custom errors
      if (error instanceof CustomError) {
        throw error;
      }

      // Wrap other errors
      throw new CustomError(
        error.message || "Failed to get CV statistics",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async fillterCVBySelection(data) {
    try {
      if (!data.limit || !data.offset) {
        throw new BadRequestError("Missing required parameters!");
      }

      let objectFillter = {
        where: {
          isFindJob: 1,
          file: {
            [Op.ne]: null,
          },
        },
        include: [
          {
            model: db.User,
            as: "userSettingData",
            attributes: {
              exclude: ["userId"],
            },
          },
          {
            model: db.Allcode,
            as: "jobTypeSettingData",
            attributes: ["value", "code"],
          },
          {
            model: db.Allcode,
            as: "expTypeSettingData",
            attributes: ["value", "code"],
          },
          {
            model: db.Allcode,
            as: "salaryTypeSettingData",
            attributes: ["value", "code"],
          },
          {
            model: db.Allcode,
            as: "provinceSettingData",
            attributes: ["value", "code"],
          },
        ],
        limit: +data.limit,
        offset: +data.offset,
        raw: true,
        nest: true,
      };

      if (data.categoryJobCode) {
        objectFillter.where = {
          ...objectFillter.where,
          categoryJobCode: data.categoryJobCode,
        };
      }

      let isHiddenPercent = false;
      let listUserSetting = await db.UserSetting.findAndCountAll(objectFillter);
      let listSkillRequired = [];
      let bonus = 0;

      if (data.experienceJobCode) {
        bonus++;
      }
      if (data.salaryCode) {
        bonus++;
      }
      if (data.provinceCode) {
        bonus++;
      }

      if (bonus > 0) {
        listUserSetting.rows.map((item) => {
          item.bonus = 0;
          if (item.expTypeSettingData.code === data.experienceJobCode) {
            item.bonus++;
          }
          if (item.salaryTypeSettingData.code === data.salaryCode) {
            item.bonus++;
          }
          if (item.provinceSettingData.code === data.provinceCode) {
            item.bonus++;
          }
        });
      }

      let lengthSkill = 0;
      let lengthOtherSkill = 0;

      if (data.listSkills) {
        data.listSkills = data.listSkills.split(",");
        lengthSkill = data.listSkills.length;
        listSkillRequired = await db.Skill.findAll({
          where: { id: data.listSkills },
          attributes: ["id", "name"],
        });
      }

      if (data.otherSkills) {
        data.otherSkills = data.otherSkills.split(",");
        lengthOtherSkill = data.otherSkills.length;
        data.otherSkills.forEach((item) => {
          listSkillRequired.push({
            id: item,
            name: item,
          });
        });
      }

      if (listSkillRequired.length > 0 || bonus > 0) {
        for (let i = 0; i < listUserSetting.rows.length; i++) {
          let match = await this.caculateMatchUserWithFilter(
            listUserSetting.rows[i],
            listSkillRequired
          );

          if (bonus > 0) {
            listUserSetting.rows[i].file =
              Math.round(
                ((match + listUserSetting.rows[i].bonus) /
                  (lengthSkill * 2 + bonus + lengthOtherSkill) +
                  Number.EPSILON) *
                  100
              ) + "%";
          } else {
            listUserSetting.rows[i].file =
              Math.round(
                (match / (lengthSkill * 2 + lengthOtherSkill) +
                  Number.EPSILON) *
                  100
              ) + "%";
          }
        }
      } else {
        isHiddenPercent = true;
        listUserSetting.rows = listUserSetting.rows.map((item) => {
          delete item.file;
          return item;
        });
      }

      return {
        data: listUserSetting.rows,
        count: listUserSetting.count,
        isHiddenPercent: isHiddenPercent,
      };
    } catch (error) {
      console.error("Error in CVService.fillterCVBySelection:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to filter CVs by selection",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async checkSeeCandidate(data) {
    try {
      // Kiểm tra tham số đầu vào
      if (!data.userId && !data.companyId) {
        throw new BadRequestError(
          "Missing required parameters! At least one of userId or companyId is required."
        );
      }

      let company;
      if (data.userId && data.userId !== "null") {
        // Tìm user và công ty của user
        const user = await db.User.findOne({
          where: { id: data.userId },
          attributes: {
            exclude: ["userId"],
          },
        });

        if (!user || !user.companyId) {
          throw new NotFoundError(
            `User with id ${data.userId} not found or not associated with a company`
          );
        }

        company = await db.Company.findOne({
          where: { id: user.companyId },
          attributes: ["id", "allowCV", "allowCvFree"],
          raw: false,
        });
      } else if (data.companyId) {
        // Tìm trực tiếp công ty theo companyId
        company = await db.Company.findOne({
          where: { id: data.companyId },
          attributes: ["id", "allowCV", "allowCvFree"],
          raw: false,
        });
      }

      // Kiểm tra công ty có tồn tại không
      if (!company) {
        throw new NotFoundError("Company not found");
      }

      // Kiểm tra và cập nhật lượt xem CV
      if (company.allowCvFree > 0) {
        company.allowCvFree -= 1;
        await company.save();
        return {
          errCode: 0,
          message: "OK - Used a free CV view",
        };
      } else if (company.allowCV > 0) {
        company.allowCV -= 1;
        await company.save();
        return {
          errCode: 0,
          message: "OK - Used a paid CV view",
        };
      } else {
        throw new UnauthorizedError("Your company has no remaining CV views");
      }
    } catch (error) {
      console.error("Error in CVService.checkSeeCandidate:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to check candidate view permission",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new CVService();
