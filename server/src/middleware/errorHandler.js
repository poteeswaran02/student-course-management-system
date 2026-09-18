/**
 * 404 Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Centralized Error Handling Middleware
 * Guarantees uniform JSON structure and prevents sensitive stack traces/internal paths leakage.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode =
    err.statusCode ||
    err.status ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';

  // Handle Body-parser / express.json() SyntaxError
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request body';
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid identifier format for field '${err.path}'`;
  }

  // Handle Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}. Please use another value.`;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Access denied. Invalid token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Access denied. Token has expired.';
  }

  // Log error on server console for observability
  if (statusCode === 500) {
    console.error(`[Server Error] ${err.message}\n${err.stack}`);
  }

  // Return clean, consistent response strictly without stack traces or internal secrets
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};

