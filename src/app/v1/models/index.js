"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const dbConfig = require("../../share/configs/db.config");

const env = process.env.NODE_ENV || "development";
const config = dbConfig[env];

const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: false, // Tắt log SQL (tuỳ chọn)
  }
);

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    console.log("Loading model file:", file); // Debugging line
    const modelModule = require(path.join(__dirname, file));
    const model =
      typeof modelModule === "function"
        ? modelModule(sequelize, Sequelize.DataTypes)
        : modelModule;
    console.log("Loaded model:", model.name, model); // Debugging line
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
