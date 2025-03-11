const { StatusCodes } = require("http-status-codes");

const cvService = require("../services/cv.service");

class CVController {
  async createNewCV(req, res, next) {
    try {
      const result = await cvService.createNewCv(req.body);
      res.status(StatusCodes.OK).json({ result });
    } catch (error) {
      next(error);
    }
  }

  async getDetailCvById(req, res, next) {
    try {
      const result = await cvService.getDetailCvById(req.query);
      res.status(StatusCodes.OK).json({ result });
    } catch (error) {
      next(error);
    }
  }

  async getAllCVByUserId(req, res, next) {
    try {
      const result = await cvService.getAllCvByUserId(req.query);
      res.status(StatusCodes.OK).json({ result });
    } catch (error) {
      next(error);
    }
  }

  async getAllListCVByPost(req, res, next) {
    try {
      const result = await cvService.getAllListCvByPost(req.query);
      res.status(StatusCodes.OK).json({ result });
    } catch (error) {
      next(error);
    }
  }

  async getStatisticalCV(req, res, next) {
    try {
      const result = await cvService.getStatisticalCv(req.query);
      res.status(StatusCodes.OK).json({ result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CVController();
