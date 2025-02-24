// src/app/share/configs/app.config.js
require("dotenv").config();

const appConfig = {
  Port: process.env.PORT,
  NodeEnv: process.env.NODE_ENV,
  DbConfig: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialect: process.env.DB_DIALECT,
  },
};

module.exports = appConfig;
