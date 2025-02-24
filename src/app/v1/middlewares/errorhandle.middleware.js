const { StatusCodes } = require("http-status-codes");

class ErrorHandlerMiddleware {
  static errorHandlerMiddleware(err, req, res, next) {
    // Ghi log lỗi chi tiết (bao gồm stack trace)
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
    });

    // Lấy statusCode và message từ lỗi, hoặc dùng giá trị mặc định
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = err.message || "Something went wrong, try again later";

    // Chuẩn bị phản hồi
    const response = {
      message,
      error: err.name || "Error", // Thêm tên lỗi để client biết loại lỗi
    };

    // Trong môi trường phát triển, trả thêm stack trace để debug
    // if (process.env.NODE_ENV === "development") {
    //   response.stack = err.stack;
    // }

    // Trả về phản hồi JSON
    res.status(statusCode).json(response);
  }
}

module.exports = ErrorHandlerMiddleware;
