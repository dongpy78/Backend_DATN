const { StatusCodes } = require("http-status-codes");
const postService = require("../services/post.service");

class SkillController {
  async createNewPost(req, res, next) {
    try {
      const result = await postService.createNewPost(req.body);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async reupPost(req, res, next) {
    try {
      const result = await postService.reupPost(req.body);
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updatePost(req, res, next) {
    try {
      const result = await postService.updatePost(req.body);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async banPost(req, res, next) {
    try {
      const result = await postService.banPost(req.body);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async activePost(req, res, next) {
    try {
      const result = await postService.activePost(req.body);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async acceptPost(req, res, next) {
    try {
      const result = await postService.acceptPost(req.body);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getListPostByAdmin(req, res, next) {
    try {
      const result = await postService.getListPostByAdmin(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAllPostByAdmin(req, res, next) {
    try {
      const result = await postService.getAllPostByAdmin(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDetailPostById(req, res, next) {
    try {
      const result = await postService.getDetailPostById(req.query.id);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getFilterPost(req, res, next) {
    try {
      const result = await postService.getFilterPost(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getStatisticalTypePost(req, res, next) {
    try {
      const result = await postService.getStatisticalTypePost(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getListNoteByPost(req, res, next) {
    try {
      const result = await postService.getListNoteByPost(req.query);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SkillController();
