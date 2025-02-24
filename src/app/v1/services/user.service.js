const db = require("../models");
const {
  CustomError,
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} = require("../errors/customErrors");

class UserService {
  async updateUser(data) {}
}

module.exports = new UserService();
