"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Tag extends Model {
    static associate(models) {
      // Tag có nhiều bài viết thông qua PostTags
      Tag.belongsToMany(models.BlogPost, {
        through: models.PostTag,
        foreignKey: "tagId",
        otherKey: "postId",
        as: "posts",
      });
    }
  }
  Tag.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false, // hoặc true nếu không bắt buộc
        references: {
          model: "Users", // Liên kết với model User
          key: "id",
        },
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
      modelName: "Tag",
      timestamps: true,
    }
  );
  return Tag;
};
