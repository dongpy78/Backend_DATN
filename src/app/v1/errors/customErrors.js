const { StatusCodes } = require("http-status-codes");

class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends CustomError {
  constructor(message = "Resource not found") {
    super(message, StatusCodes.NOT_FOUND);
    this.name = "NotFoundError";
  }
}

class BadRequestError extends CustomError {
  constructor(message = "Bad request") {
    super(message, StatusCodes.BAD_REQUEST);
    this.name = "BadRequestError";
  }
}

class UnauthenticatedError extends CustomError {
  constructor(message = "Unauthenticated") {
    super(message, StatusCodes.UNAUTHORIZED);
    this.name = "UnauthenticatedError";
  }
}

class UnauthorizedError extends CustomError {
  constructor(message = "Unauthorized access") {
    super(message, StatusCodes.FORBIDDEN);
    this.name = "UnauthorizedError";
  }
}

module.exports = {
  CustomError,
  NotFoundError,
  BadRequestError,
  UnauthenticatedError,
  UnauthorizedError,
};
