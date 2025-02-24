const { StatusCodes } = require("http-status-codes");

const cvService = require("../services/cv.service");

class CVController {
  async createNewCV(req, res, next) {
    try {
      const result = await cvService.createNewCv(req.body);
      res.status(StatusCodes.OK).json({ result });
    } catch (error) {
      next(error); // Chuyển lỗi đến errorHandlerMiddleware
    }
  }
}

module.exports = new CVController();
