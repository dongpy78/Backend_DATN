const db = require("../models");
const {
  CustomError,
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} = require("../errors/customErrors");
const { StatusCodes } = require("http-status-codes");

class UserService {
  async setDataUserSetting(data) {
    try {
      if (!data.id || !data.data) {
        throw new BadRequestError("Missing required parameters!");
      }

      const user = await db.User.findOne({
        where: { id: data.id },
        attributes: {
          exclude: ["userId"],
        },
      });

      if (!user) {
        throw new NotFoundError("Không tồn tại người dùng này");
      }

      let userSetting = await db.UserSetting.findOne({
        where: { userId: user.id },
        raw: false,
      });

      if (userSetting) {
        userSetting.salaryJobCode = data.data.salaryJobCode;
        userSetting.categoryJobCode = data.data.categoryJobCode;
        userSetting.addressCode = data.data.addressCode;
        userSetting.experienceJobCode = data.data.experienceJobCode;
        userSetting.isTakeMail = data.data.isTakeMail;
        userSetting.isFindJob = data.data.isFindJob;
        userSetting.file = data.data.file;
        await userSetting.save();
      } else {
        const params = {
          salaryJobCode: data.data.salaryJobCode,
          categoryJobCode: data.data.categoryJobCode,
          addressCode: data.data.addressCode,
          experienceJobCode: data.data.experienceJobCode,
          file: data.data.file,
          userId: user.id,
        };

        if (data.data.isTakeMail) params.isTakeMail = data.data.isTakeMail;
        if (data.data.isFindJob) params.isFindJob = data.data.isFindJob;

        await db.UserSetting.create(params);
      }

      if (data.data.listSkills && Array.isArray(data.data.listSkills)) {
        await db.UserSkill.destroy({
          where: { userId: user.id },
        });

        const objUserSkill = data.data.listSkills.map((item) => ({
          UserId: user.id,
          SkillId: item,
        }));

        await db.UserSkill.bulkCreate(objUserSkill);
      }

      return {
        errCode: 0,
        errMessage: "Hệ thống đã ghi nhận lựa chọn",
      };
    } catch (error) {
      console.error("Error in setDataUserSetting:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        error.message || "Failed to create skill due to an unexpected error",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new UserService();
