const { StatusCodes } = require("http-status-codes");
const packageCv = require("../services/packagecv.service");

class PackageCvController {
  async createNewPackageCv(req, res, next) {
    try {
      const result = await packageCv.createNewPackageCv(req.body);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updatePackageCv(req, res, next) {
    try {
      const result = await packageCv.updatePackageCv(req.body);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPackageCvById(req, res, next) {
    try {
      const { id } = req.query;
      const result = await packageCv.getPackageById(id);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAllPackageCvs(req, res, next) {
    try {
      const result = await packageCv.getAllPackage(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PackageCvController();
