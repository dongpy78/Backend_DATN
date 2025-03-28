"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("PackagePosts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        unique: true,
      },
      value: {
        type: Sequelize.STRING,
      },
      price: {
        type: Sequelize.DOUBLE,
      },
      isHot: {
        type: Sequelize.TINYINT,
      },
      isActive: {
        type: Sequelize.TINYINT,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("PackagePosts");
  },
};
