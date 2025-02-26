"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("UserSettings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      categoryJobCode: {
        type: Sequelize.STRING,
        references: {
          model: {
            tableName: "Allcodes",
          },
          key: "code",
        },
        onUpdate: "CASCADE",
      },
      salaryJobCode: {
        type: Sequelize.STRING,
        references: {
          model: {
            tableName: "Allcodes",
          },
          key: "code",
        },
        onUpdate: "CASCADE",
      },
      addressCode: {
        type: Sequelize.STRING,
        references: {
          model: {
            tableName: "Allcodes",
          },
          key: "code",
        },
        onUpdate: "CASCADE",
      },
      experienceJobCode: {
        type: Sequelize.STRING,
        references: {
          model: {
            tableName: "Allcodes",
          },
          key: "code",
        },
        onUpdate: "CASCADE",
      },
      isFindJob: {
        type: Sequelize.TINYINT,
        defaultValue: 0,
      },
      isTakeMail: {
        type: Sequelize.TINYINT,
        defaultValue: 0,
      },
      file: {
        type: Sequelize.BLOB("long"),
      },
      userId: {
        type: Sequelize.INTEGER,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("UserSettings");
  },
};
