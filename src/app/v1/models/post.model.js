"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      //! Allcode
      Post.belongsTo(models.Allcode, {
        foreignKey: "statusCode",
        targetKey: "code",
        as: "statusPostData",
      });

      //! User
      Post.belongsTo(models.User, {
        foreignKey: "userId",
        targetKey: "id",
        as: "userPostData",
      });

      //! DetailPost
      Post.belongsTo(models.DetailPost, {
        foreignKey: "detailPostId",
        targetKey: "id",
        as: "postDetailData",
      });

      //! Note
      Post.hasMany(models.Note, { foreignKey: "postId", as: "postNoteData" });

      //! CV
      Post.hasMany(models.Cv, { foreignKey: "postId", as: "postCvData" });
    }
  }
  Post.init(
    {
      statusCode: DataTypes.STRING,
      timeEnd: DataTypes.STRING,
      timePost: DataTypes.STRING,
      userId: DataTypes.INTEGER,
      isHot: DataTypes.TINYINT,
      detailPostId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Post",
    }
  );
  return Post;
};
