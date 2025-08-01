const { StatusCodes } = require("http-status-codes");
const packagePost = require("../services/packagepost.service");

class PackagePostController {
  async createNewPackagePost(req, res, next) {
    try {
      const result = await packagePost.createNewPackagePost(req.body);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updatePackagePost(req, res, next) {
    try {
      const result = await packagePost.updatePackagePost(req.body);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPackagePostById(req, res, next) {
    try {
      const { id } = req.query;
      const result = await packagePost.getPackageById(id);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAllPackagePosts(req, res, next) {
    try {
      const result = await packagePost.getAllPackage(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPackageByType(req, res, next) {
    try {
      const result = await packagePost.getPackageByType(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPaymentLink(req, res, next) {
    try {
      const result = await packagePost.getPaymentLink(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async handlePaymentSuccess(req, res, next) {
    try {
      const result = await packagePost.paymentOrderSuccess(req.body);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async setActiveTypePackage(req, res, next) {
    try {
      const result = await packagePost.setActiveTypePackage(req.body);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getStatisticalPackage(req, res, next) {
    try {
      const result = await packagePost.getStatisticalPackage(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getHistoryTrade(req, res, next) {
    try {
      const result = await packagePost.getHistoryTrade(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getSumByYear(req, res, next) {
    try {
      const result = await packagePost.getSumByYear(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PackagePostController();
