// src/app/share/configs/db.config.js
require("dotenv").config();
const path = require("path"); // Thêm dòng này

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false, // Tắt log các truy vấn SQL
    migrationStorageTableName: "sequelize_meta",
    seederStorageTableName: "sequelize_seeder",
    define: {
      underscored: true,
    },
    migrations: {
      path: path.join(__dirname, "../../../../migrations"), // Chỉ định thư mục chứa migration
    },
    models: {
      path: path.join(__dirname, "../../v1/models"), // Chỉ định thư mục chứa models
    },
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_PRODUCTION,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false,
  },
};
