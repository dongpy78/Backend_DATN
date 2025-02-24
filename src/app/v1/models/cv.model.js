"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Cv extends Model {
    static associate(models) {
      //! Post
      Cv.belongsTo(models.Post, {
        foreignKey: "postId",
        targetKey: "id",
        as: "postCvData",
      });

      //! User
      Cv.belongsTo(models.User, {
        foreignKey: "userId",
        targetKey: "id",
        as: "userCvData",
      });
    }
  }
  Cv.init(
    {
      userId: DataTypes.INTEGER,
      file: DataTypes.BLOB("long"),
      postId: DataTypes.INTEGER,
      isChecked: DataTypes.TINYINT,
      description: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Cv",
    }
  );
  return Cv;
};
