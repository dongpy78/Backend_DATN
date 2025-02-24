"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("UserSkills", {
      userId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      skillId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: "Skills",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("UserSkills");
  },
};
