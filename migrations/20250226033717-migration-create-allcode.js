"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Allcodes", {
      code: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING,
      },
      type: {
        type: Sequelize.STRING,
      },
      value: {
        type: Sequelize.STRING,
      },
      image: {
        type: Sequelize.STRING,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Allcodes");
  },
};
