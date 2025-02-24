"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Posts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
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
      timeEnd: {
        type: Sequelize.STRING,
      },
      userId: {
        type: Sequelize.INTEGER,
      },
      isHot: {
        type: Sequelize.TINYINT,
      },
      timePost: {
        type: Sequelize.STRING,
      },
      detailPostId: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable("Posts");
  },
};
