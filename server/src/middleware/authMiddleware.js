const { verifyToken } = require('../utils/jwtUtils');
const userModel = require('../models/userModel');

/**
 * Middleware to protect routes that require authentication.
 * It checks for a JWT in the Authorization header (Bearer token).
 * If valid, it attaches the decoded user payload to `req.user`.
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = verifyToken(token);

      if (!decoded || !decoded.id) {
        return res.status(401).json({ message: 'Not authorized, token failed or user ID missing in token.' });
      }

      // Get user from the token's ID
      // The decoded token contains { id: user.id, email: user.email }
      // We fetch the full user object to ensure it still exists and to get up-to-date info.
      const currentUser = await userModel.findUserById(decoded.id);

      if (!currentUser) {
        return res.status(401).json({ message: 'Not authorized, user belonging to this token no longer exists.' });
      }

      // Attach user to the request object.
      // The userModel.findUserById should ideally return user data without sensitive info like password_hash.
      // If it does include it, make sure to strip it here. Our current in-memory one does.
      req.user = currentUser;

      next();
    } catch (error) {
      console.error('Authentication Error in Middleware:', error);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Not authorized, token expired.' });
      }
      // For other jwt errors (JsonWebTokenError, NotBeforeError)
      if (error.name && error.name.includes('JsonWebTokenError')) {
        return res.status(401).json({ message: 'Not authorized, token is invalid.' });
      }
      return res.status(401).json({ message: 'Not authorized, token issue.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided.' });
  }
};

/**
 * Middleware to check for specific roles (example for future use).
 * Assumes `req.user.roles` is an array of roles or `req.user.role` is a string.
 * @param  {...string} allowedRoles - Allowed roles.
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) { // Should be populated by `protect` middleware first
        return res.status(401).json({ message: 'Not authenticated.' });
    }

    // Example: Check if user has a 'role' property
    // This part needs to be adapted based on how roles are stored on the user object
    // For instance, if user.role is a string:
    // if (!allowedRoles.includes(req.user.role)) {
    //   return res.status(403).json({ message: `Forbidden: Role '${req.user.role}' is not authorized.` });
    // }

    // Or if user.roles is an array:
    // const hasRequiredRole = req.user.roles && req.user.roles.some(role => allowedRoles.includes(role));
    // if (!hasRequiredRole) {
    //    return res.status(403).json({ message: 'Forbidden: You do not have the required role.' });
    // }

    // For now, this is a placeholder as roles aren't fully implemented in userModel
    console.warn("Authorization middleware 'authorize' called, but role checking logic is a placeholder.");

    next();
  };
};

module.exports = {
  protect,
  authorize,
};
