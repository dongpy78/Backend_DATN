"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      firstName: {
        type: Sequelize.STRING,
      },
      lastName: {
        type: Sequelize.STRING,
      },
      phonenumber: {
        // Thêm số điện thoại
        type: Sequelize.STRING,
        unique: true, // Không được trùng số
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING,
      },
      genderCode: {
        type: Sequelize.STRING,
        references: {
          model: {
            tableName: "Allcodes",
          },
          key: "code",
        },
        onUpdate: "CASCADE",
      },
      image: {
        type: Sequelize.STRING,
      },
      dob: {
        type: Sequelize.STRING,
      },
      companyId: {
        type: Sequelize.INTEGER,
        foreignKey: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Users");
  },
};
