"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class BlogCategory extends Model {
    static associate(models) {
      // Một danh mục có nhiều bài viết
      BlogCategory.hasMany(models.BlogPost, {
        foreignKey: "categoryId",
        as: "posts",
      });
    }
  }
  BlogCategory.init(
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
      },
      description: {
        type: DataTypes.STRING(255),
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
      modelName: "BlogCategory",
      timestamps: true,
    }
  );
  return BlogCategory;
};
