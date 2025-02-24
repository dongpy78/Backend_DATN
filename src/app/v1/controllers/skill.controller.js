const { StatusCodes } = require("http-status-codes");

const skillService = require("../services/skill.service");

class SkillController {
  async createNewSkill(req, res, next) {
    try {
      const result = await skillService.createNewSkill(req.body);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteSkill(req, res, next) {
    try {
      const result = await skillService.deleteSkill(req.query.id);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateSkill(req, res, next) {
    try {
      const result = await skillService.updateSkill(req.body);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDetailSkillById(req, res, next) {
    try {
      const result = await skillService.getDetailSkillById(req.query.id);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAllSkillByJobCode(req, res, next) {
    try {
      const result = await skillService.getAllSkillByJobCode(
        req.query.categoryJobCode
      );
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getListSkill(req, res, next) {
    try {
      const result = await skillService.getListSkill(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SkillController();
