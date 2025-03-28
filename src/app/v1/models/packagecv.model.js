"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PackageCv extends Model {
    static associate(models) {
      //orderpackage
      PackageCv.hasMany(models.OrderPackage, {
        foreignKey: "packageCvId",
        as: "packageOrderCvData",
      });
    }
  }
  PackageCv.init(
    {
      name: DataTypes.STRING,
      value: DataTypes.INTEGER,
      price: DataTypes.DOUBLE,
      isActive: DataTypes.TINYINT,
    },
    {
      sequelize,
      modelName: "PackageCv",
      timestamps: false,
    }
  );
  return PackageCv;
};
