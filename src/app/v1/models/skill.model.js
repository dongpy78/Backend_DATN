"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Skill extends Model {
    static associate(models) {
      //! Allcode
      Skill.belongsTo(models.Allcode, {
        foreignKey: "categoryJobCode",
        targetKey: "code",
        as: "jobTypeSkillData",
      });

      //! UserSkill
      Skill.belongsToMany(models.User, { through: models.UserSkill });
    }
  }
  Skill.init(
    {
      name: DataTypes.STRING,
      categoryJobCode: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Skill",
      timestamps: false,
    }
  );
  return Skill;
};
