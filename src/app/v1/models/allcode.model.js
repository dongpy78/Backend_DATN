"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Allcode extends Model {
    static associate(models) {
      //! Account
      Allcode.hasMany(models.Account, {
        foreignKey: "roleCode",
        as: "roleData",
      });
      Allcode.hasMany(models.Account, {
        foreignKey: "statusCode",
        as: "statusAccountData",
      });

      //! User
      Allcode.hasMany(models.User, {
        foreignKey: "genderCode",
        as: "genderData",
      });

      //! Skill
      Allcode.hasMany(models.Skill, {
        foreignKey: "categoryJobCode",
        as: "jobTypeSkillData",
      });

      //! Company
      Allcode.hasMany(models.Company, {
        foreignKey: "statusCode",
        as: "statusCompanyData",
      });
      Allcode.hasMany(models.Company, {
        foreignKey: "censorCode",
        as: "censorData",
      });

      //! Post
      Allcode.hasMany(models.DetailPost, {
        foreignKey: "statusCode",
        as: "statusPostData",
      });

      //! Detailpost
      Allcode.hasMany(models.DetailPost, {
        foreignKey: "categoryJobCode",
        as: "jobTypePostData",
      });
      Allcode.hasMany(models.DetailPost, {
        foreignKey: "categoryWorktypeCode",
        as: "workTypePostData",
      });
      Allcode.hasMany(models.DetailPost, {
        foreignKey: "salaryJobCode",
        as: "salaryTypePostData",
      });
      Allcode.hasMany(models.DetailPost, {
        foreignKey: "categoryJoblevelCode",
        as: "jobLevelPostData",
      });
      Allcode.hasMany(models.DetailPost, {
        foreignKey: "experienceJobCode",
        as: "expTypePostData",
      });
      Allcode.hasMany(models.DetailPost, {
        foreignKey: "genderPostCode",
        as: "genderPostData",
      });
      Allcode.hasMany(models.DetailPost, {
        foreignKey: "addressCode",
        as: "provincePostData",
      });

      //! userSetting
      Allcode.hasMany(models.UserSetting, {
        foreignKey: "categoryJobCode",
        as: "jobTypeSettingData",
      });
      Allcode.hasMany(models.UserSetting, {
        foreignKey: "salaryJobCode",
        as: "salaryTypeSettingData",
      });
      Allcode.hasMany(models.UserSetting, {
        foreignKey: "experienceJobCode",
        as: "expTypeSettingData",
      });
      Allcode.hasMany(models.UserSetting, {
        foreignKey: "addressCode",
        as: "provinceSettingData",
      });

      //! Blog Posts
      Allcode.hasMany(models.BlogPost, {
        foreignKey: "statusCode",
        as: "blogPosts",
      });
    }
  }
  Allcode.init(
    {
      type: DataTypes.STRING,
      value: DataTypes.STRING,
      code: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      image: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Allcode",
      timestamps: false,
    }
  );
  Allcode.removeAttribute("id");
  return Allcode;
};
