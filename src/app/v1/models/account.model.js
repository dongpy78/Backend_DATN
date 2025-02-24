"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Account extends Model {
    static associate(models) {
      //! Allcode
      Account.belongsTo(models.Allcode, {
        foreignKey: "roleCode",
        targetKey: "code",
        as: "roleData",
      });

      Account.belongsTo(models.Allcode, {
        foreignKey: "statusCode",
        targetKey: "code",
        as: "statusAccountData",
      });

      //! User
      Account.belongsTo(models.User, {
        foreignKey: "userId",
        targetKey: "id",
        as: "userAccountData",
      });
    }
  }
  Account.init(
    {
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      roleCode: DataTypes.STRING,
      statusCode: DataTypes.STRING,
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Account",
    }
  );
  return Account;
};
