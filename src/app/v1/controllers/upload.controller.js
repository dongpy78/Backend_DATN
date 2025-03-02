const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../errors/customErrors"); // Đảm bảo đường dẫn đúng
const { upload, formatImage } = require("../middlewares/multer.middleware");
const cloudinary = require("../../share/configs/cloudinary.config");

class UploadController {
  async uploadImage(req, res, next) {
    try {
      upload.single("image")(req, res, async (err) => {
        if (err) {
          return next(
            new BadRequestError("Error uploading file: " + err.message)
          );
        }

        if (!req.file) {
          return next(new BadRequestError("No file uploaded"));
        }

        const base64Image = formatImage(req.file);
        const result = await cloudinary.uploader.upload(base64Image, {
          folder: "uploads",
          resource_type: "image",
        });

        res.status(StatusCodes.OK).json({
          message: "Image uploaded successfully",
          imageUrl: result.secure_url,
          publicId: result.public_id,
        });
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UploadController();
