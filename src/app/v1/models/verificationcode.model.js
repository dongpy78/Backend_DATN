"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class VerificationCode extends Model {
    static associate(models) {
      // Có thể thêm associations sau nếu cần
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
      code: {
        type: DataTypes.STRING(6),
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
      tableName: "verification_codes", // Tùy chọn: đặt tên bảng theo quy ước snake_case
      timestamps: true, // Tự động thêm createdAt, updatedAt
      paranoid: false, // Không sử dụng soft delete
    }
  );

  return VerificationCode;
};
