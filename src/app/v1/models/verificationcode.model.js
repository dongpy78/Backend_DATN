"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class VerificationCode extends Model {
    static associate(models) {
      // Có thể thêm associations nếu cần
    }
  }

  VerificationCode.init(
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false, // Lưu token JWT thay vì code 6 ký tự
      },
      data: {
        type: DataTypes.JSON, // Lưu dữ liệu đăng ký (firstName, lastName, password, v.v.)
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "VerificationCode",
      tableName: "verification_codes",
      timestamps: true,
      paranoid: false,
    }
  );

  return VerificationCode;
};
