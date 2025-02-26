"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Skills", {
      id: {
        allowNull: false, // Không được để trống
        autoIncrement: true, // Tự động tăng
        primaryKey: true, // Định nghĩa là khóa chính
        type: Sequelize.INTEGER, // Kiểu dữ liệu là số nguyên
      },
      name: {
        type: Sequelize.STRING, // Kiểu dữ liệu là chuỗi (VARCHAR)
      },
      categoryJobCode: {
        type: Sequelize.STRING, // Kiểu dữ liệu là chuỗi (VARCHAR)
        references: {
          model: {
            tableName: "Allcodes", // Tham chiếu đến bảng Allcodes
          },
          key: "code", // Khóa chính là code thuộc bảng Allcodes
        },
        onUpdate: "CASCADE", // Khi bảng Allcodes thay đổi, thì bảng Skills cũng thay đổi theo
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Skills");
  },
};
