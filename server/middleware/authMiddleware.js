// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  // ... (your existing protect function - no changes needed here for now) ...
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found for this token');
      }
      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      res.status(401);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new Error('Not authorized, token failed or expired');
      }
      throw new Error('Not authorized, token failed'); // Generic fallback
    }
  }
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }
};

// Role-based authorization middleware
const authorize = (...roles) => { // Takes an array of allowed roles
  return (req, res, next) => {
    // req.user should have been set by the 'protect' middleware
    if (!req.user) {
      // This case should ideally be caught by 'protect' first if 'protect' is always used before 'authorize'
      res.status(401);
      throw new Error('Not authorized, no user data found');
    }
    if (!roles.includes(req.user.role)) {
      res.status(403); // Forbidden
      throw new Error(
        `User role '${req.user.role}' is not authorized to access this route. Allowed roles: ${roles.join(', ')}.`
      );
    }
    next(); // User has one of the allowed roles
  };
};

module.exports = { protect, authorize };