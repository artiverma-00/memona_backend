const { sendError } = require("../utils/responseHandler");

const errorHandler = (err, req, res, next) => {
  const statusCode =
    Number.isInteger(err.statusCode) && err.statusCode >= 400
      ? err.statusCode
      : 500;
  const isServerError = statusCode >= 500;
  const message = isServerError
    ? process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error"
    : err.message || "Request failed";

  if (process.env.NODE_ENV !== "test") {
    console.error("[ERROR]", {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    });
  }

  return sendError(res, statusCode, message);
};

module.exports = errorHandler;
