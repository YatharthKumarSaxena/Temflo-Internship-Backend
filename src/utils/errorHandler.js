class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request') {
    return new ErrorHandler(message, 400);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ErrorHandler(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new ErrorHandler(message, 403);
  }

  static notFound(message = 'Not Found') {
    return new ErrorHandler(message, 404);
  }

  static conflict(message = 'Conflict') {
    return new ErrorHandler(message, 409);
  }

  static unprocessableEntity(message = 'Unprocessable Entity') {
    return new ErrorHandler(message, 422);
  }

  static internalServer(message = 'Internal Server Error') {
    return new ErrorHandler(message, 500);
  }

  static notImplemented(message = 'Not Implemented') {
    return new ErrorHandler(message, 501);
  }

  static serviceUnavailable(message = 'Service Unavailable') {
    return new ErrorHandler(message, 503);
  }
}

module.exports = ErrorHandler;
