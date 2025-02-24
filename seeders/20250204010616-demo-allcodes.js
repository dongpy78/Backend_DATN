"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Allcodes", [
      // Vai trò (ROLE)
      {
        code: "CANDIDATE",
        type: "ROLE",
        value: "Ứng viên",
        image: null,
      },
      {
        code: "COMPANY",
        type: "ROLE",
        value: "Công ty",
        image: null,
      },
      {
        code: "ADMIN",
        type: "ROLE",
        value: "Quản trị viên",
        image: null,
      },

      // Loại công việc (JOBTYPE)
      {
        code: "frontend",
        type: "JOBTYPE",
        value: "Frontend Developer",
        image: "http://res.cloudinary.com/bingo2706/image/upload/v...",
      },
      {
        code: "backend",
        type: "JOBTYPE",
        value: "Backend Developer",
        image: "http://res.cloudinary.com/bingo2706/image/upload/v...",
      },
      {
        code: "fullstack",
        type: "JOBTYPE",
        value: "Fullstack Developer",
        image: "http://res.cloudinary.com/bingo2706/image/upload/v...",
      },
      {
        code: "devops",
        type: "JOBTYPE",
        value: "DevOps Engineer",
        image: "http://res.cloudinary.com/bingo2706/image/upload/v...",
      },
      {
        code: "data-science",
        type: "JOBTYPE",
        value: "Data Scientist",
        image: "http://res.cloudinary.com/bingo2706/image/upload/v...",
      },
      {
        code: "ai",
        type: "JOBTYPE",
        value: "AI Engineer",
        image: "http://res.cloudinary.com/bingo2706/image/upload/v...",
      },

      // Tỉnh thành (PROVINCE)
      {
        code: "nha-trang",
        type: "PROVINCE",
        value: "Nha Trang",
        image: null,
      },
      {
        code: "cam-ranh",
        type: "PROVINCE",
        value: "Cam Ranh",
        image: null,
      },

      // Kinh nghiệm (EXPTYPE)
      {
        code: "fresher",
        type: "EXPTYPE",
        value: "Fresher",
        image: null,
      },
      {
        code: "junior",
        type: "EXPTYPE",
        value: "Junior (1-2 năm)",
        image: null,
      },
      {
        code: "mid-level",
        type: "EXPTYPE",
        value: "Mid-level (2-5 năm)",
        image: null,
      },
      {
        code: "senior",
        type: "EXPTYPE",
        value: "Senior (5+ năm)",
        image: null,
      },

      // Mức lương (SALARYTYPE)
      {
        code: "5-10tr",
        type: "SALARYTYPE",
        value: "5 - 10 triệu",
        image: null,
      },
      {
        code: "10-15tr",
        type: "SALARYTYPE",
        value: "10 - 15 triệu",
        image: null,
      },
      {
        code: "15-20tr",
        type: "SALARYTYPE",
        value: "15 - 20 triệu",
        image: null,
      },
      {
        code: "20-30tr",
        type: "SALARYTYPE",
        value: "20 - 30 triệu",
        image: null,
      },
      {
        code: "30tr+",
        type: "SALARYTYPE",
        value: "30 triệu+",
        image: null,
      },

      // Yêu cầu giới tính (GENDERPOST)
      {
        code: "male",
        type: "GENDERPOST",
        value: "Nam",
        image: null,
      },
      {
        code: "female",
        type: "GENDERPOST",
        value: "Nữ",
        image: null,
      },
      {
        code: "both",
        type: "GENDERPOST",
        value: "Cả hai",
        image: null,
      },
      {
        code: "S1",
        type: "STATUS",
        value: "Đã kích hoạt",
        image: null,
      },
      {
        code: "S2",
        type: "STATUS",
        value: "Không kích hoạt",
        image: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Allcodes", null, {});
  },
};
