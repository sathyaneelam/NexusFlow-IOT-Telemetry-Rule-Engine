/**
 * Centralized Error Handler Middleware.
 * Standardizes API error responses across all modules.
 */
const errorHandler = (err, req, res, next) => {
  // If response has already started streaming, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: "ValidationError",
      message: messages.join(", ") || err.message,
    });
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId or invalid type)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: "CastError",
      message: `Invalid value for field '${err.path}'`,
    });
  }

  // Handle custom status codes or fallback to 500
  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred",
  });
};

module.exports = errorHandler;
