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
}

module.exports = new CVService();
