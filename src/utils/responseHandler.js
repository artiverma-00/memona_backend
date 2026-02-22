const sendSuccess = (res, statusCode, maybeMessageOrData, maybeData) => {
  const data = maybeData === undefined ? maybeMessageOrData : maybeData;
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  sendSuccess,
  sendError,
  createHttpError,
  asyncHandler,
};
