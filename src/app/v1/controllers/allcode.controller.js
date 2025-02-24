const { StatusCodes } = require("http-status-codes");
const allCodeService = require("../services/allcode.service");

class AllCodeController {
  async createNewAllCode(req, res, next) {
    try {
      const result = await allCodeService.createNewAllCode(req.body);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAllCode(req, res, next) {
    try {
      const result = await allCodeService.getAllCode(req.query.type);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateAllCode(req, res, next) {
    try {
      const result = await allCodeService.updateAllCode(req.body);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDetailAllCode(req, res, next) {
    try {
      const result = await allCodeService.getDetailAllCode(req.query.code);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteAllCode(req, res, next) {
    try {
      const result = await allCodeService.deleteAllCode(req.query.code);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getListAllCode(req, res, next) {
    try {
      const result = await allCodeService.getListAllCode(req.query);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getListJobTypeAndCountPost(req, res, next) {
    try {
      const result = await allCodeService.getListJobTypeAndCountPost(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AllCodeController();
