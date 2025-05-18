"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "PostTags",
      {
        postId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "BlogPosts",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        tagId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "Tags",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      },
      {
        uniqueKeys: {
          PostTag_unique: {
            fields: ["postId", "tagId"],
          },
        },
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("PostTags");
  },
};
