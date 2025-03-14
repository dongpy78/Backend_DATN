const { NotFoundError } = require("../errors/customErrors");
const cloudinary = require("../../share/configs/cloudinary.config");
const mediaConstants = require("../../share/constants/media.constant");

class MediaService {
  async uploadSingle(req) {
    const file = req.file;

    if (!file) {
      throw new NotFoundError("File not found");
    }

    const fileBase64 = file.buffer.toString("base64");
    const fileUri = `data:${file.mimetype};base64,${fileBase64}`;

    const result = await cloudinary.uploader.upload(fileUri, {
      folder: mediaConstants.Folder,
    });

    // result.url;
    return { public_id: result.public_id, url: result.secure_url };
  }

  async uploadMultiple(req) {
    const files = req.files;

    if (!files || files.length === 0) {
      throw new NotFoundError("File not found");
    }

    const uploadPromises = files.map(async (file) => {
      return new Promise(async (resolve, reject) => {
        try {
          try {
            const fileBase64 = file.buffer.toString("base64");
            const fileUri = `data:${file.mimetype};base64,${fileBase64}`;

            const result = await cloudinary.uploader.upload(fileUri, {
              folder: mediaConstants.Folder,
            });

            resolve({
              public_id: result.public_id,
              url: result.secure_url,
            });
          } catch (error) {
            console.error("Error uploading file:", error);
            reject(error);
          }
        } catch (error) {}
      });
    });

    const results = await Promise.all(uploadPromises);
    return results;
  }

  async deleteSingle(public_id) {
    if (!public_id) {
      throw new NotFoundError("Public_id not found");
    }
    await cloudinary.uploader.destroy(public_id);

    return { message: `Delete success ${public_id}` };
  }

  async getMedia(public_id) {
    if (!public_id) {
      throw new NotFoundError("Public_id not found");
    }

    const result = await cloudinary.api.resource(public_id);
    return result;
  }
}

module.exports = new MediaService();
