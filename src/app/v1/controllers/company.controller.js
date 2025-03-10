const { StatusCodes } = require("http-status-codes");
const companyService = require("../services/company.service");

class CompanyController {
  async createCompany(req, res, next) {
    try {
      const files = {
        thumbnail: req.files && req.files["thumbnail"],
        coverImage: req.files && req.files["coverImage"],
      };
      console.log("Received data:", req.body);
      console.log("Received files:", files);
      const result = await companyService.createNewCompany(req.body, files);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateCompany(req, res, next) {
    try {
      const files = {
        thumbnail: req.files && req.files["thumbnail"],
        coverImage: req.files && req.files["coverImage"],
      };
      console.log("Received data:", req.body);
      console.log("Received files:", files);
      const result = await companyService.updateCompany(req.body, files);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async banCompany(req, res, next) {
    try {
      const result = await companyService.banCompany(req.body.id);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async unbanCompany(req, res, next) {
    try {
      const result = await companyService.unbanCompany(req.body.id);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async acceptCompany(req, res, next) {
    try {
      const result = await companyService.acceptCompany(req.body);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getListCompany(req, res, next) {
    try {
      const result = await companyService.getListCompany(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDetailCompanyById(req, res, next) {
    try {
      const result = await companyService.getDetailCompanyById(req.query.id);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDetailCompanyByUserId(req, res, next) {
    try {
      const result = await companyService.getDetailCompanyByUserId(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAllUserByCompanyId(req, res, next) {
    try {
      const result = await companyService.getAllUserByCompanyId(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async handleQuitCompany(req, res, next) {
    try {
      const result = await companyService.handleQuitCompany(req.body);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAllCompanyByAdmin(req, res, next) {
    try {
      const result = await companyService.getAllCompanyByAdmin(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CompanyController();
