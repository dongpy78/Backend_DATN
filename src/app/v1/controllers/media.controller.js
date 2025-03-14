const { StatusCodes } = require("http-status-codes");
const mediaService = require("../services/media.service");

class MediaController {
  async uploadSingle(req, res) {
    try {
      const result = await mediaService.uploadSingle(req);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json(error);
    }
  }

  async uploadMultiple(req, res) {
    try {
      const result = await mediaService.uploadMultiple(req);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json(error);
    }
  }

  async deleteSingle(req, res) {
    try {
      const result = await mediaService.deleteSingle(req.query.public_id);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json(error);
    }
  }
  async getMedia(req, res) {
    try {
      const { public_id } = req.query;
      const result = await mediaService.getMedia(public_id);
      res.status(StatusCodes.OK).json(result);
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json(error);
    }
  }
}

module.exports = new MediaController();
