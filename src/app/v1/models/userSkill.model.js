"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserSkill extends Model {
    static associate(models) {
      UserSkill.belongsTo(models.User);
      UserSkill.belongsTo(models.Skill);
    }
  }
  UserSkill.init(
    {},
    {
      sequelize,
      modelName: "UserSkill",
      timestamps: false,
    }
  );
  return UserSkill;
};
