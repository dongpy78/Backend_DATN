"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Accounts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      email: {
        // Thay vì phonenumber
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
      },
      roleCode: {
        type: Sequelize.STRING,
        references: {
          model: {
            tableName: "Allcodes",
          },
          key: "code",
        },
        onUpdate: "CASCADE",
      },
      statusCode: {
        type: Sequelize.STRING,
        references: {
          model: {
            tableName: "Allcodes",
          },
          key: "code",
        },
        onUpdate: "CASCADE",
      },
      userId: {
        type: Sequelize.INTEGER,
        unique: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Accounts");
  },
};
