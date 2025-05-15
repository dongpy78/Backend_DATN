const { StatusCodes } = require("http-status-codes");

const authService = require("../services/auth.service");

class AuthController {
  // [POST] /register
  async register(req, res, next) {
    try {
      const result = await authService.register(req);
      return res.status(StatusCodes.CREATED).json({
        status: "success",
        message: "Verification email sent successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // [GET] /verify-email?token=...
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "Token không được cung cấp",
        });
      }
      const result = await authService.verifyEmail(token); // Chỉ truyền token
      return res.status(StatusCodes.OK).json({
        status: "success",
        message: "Email verified successfully",
        data: result,
      });
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

  // updateUser
  async updateUser(req, res, next) {
    try {
      const result = await authService.updateUser(req.body);
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
