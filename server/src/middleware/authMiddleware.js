const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Authentication Middleware
 * Validates JWT token from the Authorization header (Bearer <token>).
 * Attaches the authenticated user to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists and follows Bearer pattern
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Reject missing token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify token using JWT_SECRET
    const secret = process.env.JWT_SECRET || 'student_course_management_jwt_secret_dev_key_2026';
    let decoded;

    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Token has expired.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.',
      });
    }

    // Verify user still exists in database (or attach payload info)
    // Exclude password
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role Authorization Middleware
 * Restricts access to specified roles (e.g., 'admin', 'student').
 * Usage: authorizeRoles('admin') or authorizeRoles('admin', 'student')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking role permissions.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorizeRoles,
};
