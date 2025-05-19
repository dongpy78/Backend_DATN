"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PostTag extends Model {
    static associate(models) {
      // PostTag thuộc về một bài viết
      PostTag.belongsTo(models.BlogPost, {
        foreignKey: "postId",
        as: "post",
      });
      // PostTag thuộc về một tag
      PostTag.belongsTo(models.Tag, {
        foreignKey: "tagId",
        as: "tag",
      });
    }
  }
  PostTag.init(
    {
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tagId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "PostTag",
      timestamps: true,
    }
  );
  return PostTag;
};
