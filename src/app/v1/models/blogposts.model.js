"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class BlogPost extends Model {
    static associate(models) {
      // Bài viết thuộc về một danh mục
      BlogPost.belongsTo(models.BlogCategory, {
        foreignKey: "categoryId",
        as: "category",
      });
      // Bài viết được tạo bởi một người dùng
      BlogPost.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
      // Bài viết có trạng thái từ Allcodes
      BlogPost.belongsTo(models.Allcode, {
        foreignKey: "statusCode",
        targetKey: "code",
        as: "status",
      });
      // Bài viết có nhiều tag thông qua PostTags
      BlogPost.belongsToMany(models.Tag, {
        through: models.PostTag,
        foreignKey: "postId",
        otherKey: "tagId",
        as: "tags",
      });
    }
  }
  BlogPost.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      contentHTML: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
      contentMarkDown: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
      thumbnail: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: true,
      },
      statusCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "BlogPost",
      timestamps: true,
    }
  );
  return BlogPost;
};
