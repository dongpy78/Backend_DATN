"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PackagePost extends Model {
    static associate(models) {
      //orderpackage
      PackagePost.hasMany(models.OrderPackage, {
        foreignKey: "packagePostId",
        as: "packageOrderData",
      });
    }
  }
  PackagePost.init(
    {
      name: DataTypes.STRING,
      value: DataTypes.INTEGER,
      price: DataTypes.DOUBLE,
      isHot: DataTypes.TINYINT,
      isActive: DataTypes.TINYINT,
    },
    {
      sequelize,
      modelName: "PackagePost",
      timestamps: false,
    }
  );
  return PackagePost;
};
