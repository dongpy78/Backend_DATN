"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      //! Allcode
      //! User thuộc về Allcode
      User.belongsTo(models.Allcode, {
        foreignKey: "genderCode", // genderCode trỏ đến cột code của bảng Allcode để lấy giá trị
        targetKey: "code", // code là khóa chính của bảng Allcode
        as: "genderData", // Đặt biệt danh để lấy dữ liệu
      });

      //!Account
      //! Mỗi User có một Account
      User.hasOne(models.Account, {
        foreignKey: "userId", // Liên kết tài khoản thông qua userId
        as: "userAccountData",
      });

      //! UserSkill - Skill
      User.belongsToMany(models.Skill, { through: models.UserSkill });

      //! Company
      User.belongsTo(models.Company, {
        foreignKey: "companyId",
        targetKey: "id",
        as: "userCompanyData",
      });
      User.hasOne(models.Company, {
        foreignKey: "userId",
        as: "companyUserData",
      });

      //! Note
      User.hasMany(models.Note, { foreignKey: "userId", as: "userNoteData" });

      //! CV
      User.hasMany(models.Cv, { foreignKey: "userId", as: "userCvData" });

      //! UserSetting
      User.hasOne(models.UserSetting, {
        foreignKey: "userId",
        as: "userSettingData",
      });

      //! BlogPost
      User.hasMany(models.BlogPost, {
        foreignKey: "userId",
        as: "blogPosts",
      });
    }
  }
  User.init(
    {
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      phonenumber: DataTypes.STRING,
      address: DataTypes.STRING,
      genderCode: DataTypes.STRING,
      image: DataTypes.STRING,
      dob: DataTypes.STRING,
      companyId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "User",
      timestamps: false,
    }
  );
  return User;
};
