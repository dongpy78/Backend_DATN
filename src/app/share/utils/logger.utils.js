const { createLogger, format, transports } = require("winston");

// Cấu hình logger
const logger = createLogger({
  level: "info", // Log level (info, error, warn, debug, v.v.)
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // Thêm timestamp vào log
    format.errors({ stack: true }), // Log cả stack trace nếu có lỗi
    format.splat(), // Hỗ trợ string interpolation
    format.json() // Định dạng log dưới dạng JSON
  ),
  transports: [
    // Ghi log ra console
    new transports.Console({
      format: format.combine(
        format.colorize(), // Thêm màu sắc cho log
        format.printf(({ level, message, timestamp, stack }) => {
          return `${timestamp} [${level}]: ${stack || message}`;
        })
      ),
    }),
    // Ghi log ra file
    new transports.File({ filename: "logs/error.log", level: "error" }), // Chỉ ghi log lỗi vào file
    new transports.File({ filename: "logs/combined.log" }), // Ghi tất cả log vào file
  ],
});

module.exports = logger;
