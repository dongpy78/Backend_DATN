const { StatusCodes } = require("http-status-codes");

const authService = require("../services/auth.service");

class AuthController {
  // Signup
  async register(req, res, next) {
    try {
      const result = await authService.register(req);
      return res.status(StatusCodes.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Login
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body, res);
      console.log(result);
      return res.status(StatusCodes.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const result = await authService.refreshToken(req, res);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Forgot Password
  async forgotPassword(req, res, next) {
    try {
      const result = await authService.forgotPassword(req.body);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Logout
  async logout(req, res, next) {
    try {
      const result = await authService.logout(res);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Ban Account
  async banAccount(req, res, next) {
    try {
      const { userId } = req.body; // Lấy userId từ body request
      const result = await authService.banAccount(userId);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Unban Account
  async unbanAccount(req, res, next) {
    try {
      const { userId } = req.body; // Lấy userId từ body request
      const result = await authService.unbanAccount(userId);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAllUser(req, res, next) {
    try {
      const result = await authService.getAllUser(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDetailUserById(req, res, next) {
    try {
      const result = await authService.getDetailUserById(req.query.userId);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
