"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Note extends Model {
    static associate(models) {
      //! Post
      Note.belongsTo(models.Post, {
        foreignKey: "postId",
        targetKey: "id",
        as: "postNoteData",
      });
      //! User
      Note.belongsTo(models.User, {
        foreignKey: "userId",
        targetKey: "id",
        as: "userNoteData",
      });
    }
  }
  Note.init(
    {
      postId: DataTypes.INTEGER,
      note: DataTypes.STRING,
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Note",
    }
  );
  return Note;
};
