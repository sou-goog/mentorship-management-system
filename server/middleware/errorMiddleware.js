// server/middleware/errorMiddleware.js

// Middleware for handling "Not Found" errors (404)
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Pass the error to the next error handling middleware
};

// General error handling middleware
// This MUST come after all your routes and other middleware
// It's identified as error handling middleware by having 4 arguments (err, req, res, next)
const errorHandler = (err, req, res, next) => {
  // Sometimes an error might come through with a 200 status code
  // If so, set it to 500 (Internal Server Error)
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose specific error handling (optional, but good for user-friendly messages)
  // Bad ObjectId (cast error)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404; // Not Found, as the ID format is wrong so it can't be found
    message = 'Resource not found (Invalid ID format)';
  }

  // Mongoose duplicate key error (e.g., unique email already exists)
  // This often gets caught before this middleware if you check `userExists` first,
  // but this is a good fallback.
  if (err.code === 11000) {
    statusCode = 400; // Bad Request
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered for ${field}. Please use another value.`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400; // Bad Request
    // Collect all validation error messages
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  res.status(statusCode).json({
    message: message,
    // Show stack trace only in development mode for debugging
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };