const { StatusCodes } = require("http-status-codes");

const userService = require("../services/user.service");

class UserService {
  async setDataUserSetting(req, res, next) {
    try {
      const result = await userService.setDataUserSetting(req.body);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserService();
