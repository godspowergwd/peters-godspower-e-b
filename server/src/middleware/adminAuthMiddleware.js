const { verifyToken } = require('../utils/jwtUtils');
const adminUserModel = require('../models/adminUserModel');

/**
 * Middleware to protect admin routes.
 * It checks for a JWT, verifies it, and ensures it's an admin token.
 * If valid, attaches the decoded admin user payload to `req.adminUser`.
 */
const adminProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token); // Using the same verifyToken

      if (!decoded || !decoded.id || decoded.type !== 'admin') { // Key check for admin type
        return res.status(401).json({ message: 'Not authorized as admin, token failed or invalid type.' });
      }

      // Fetch admin user details (excluding password hash)
      const currentAdmin = await adminUserModel.findAdminUserById(decoded.id);
      if (!currentAdmin) {
        return res.status(401).json({ message: 'Not authorized as admin, admin user not found.' });
      }

      // Check if the role in token matches current role (optional, for role changes during session)
      if (decoded.role !== currentAdmin.role) {
        return res.status(401).json({ message: 'Admin role mismatch, please re-authenticate.' });
      }

      req.adminUser = currentAdmin; // Attach admin user object to request
      next();
    } catch (error) {
      console.error('Admin Authentication Error:', error);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Not authorized, token expired.' });
      }
      return res.status(401).json({ message: 'Not authorized as admin, token verification failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized as admin, no token provided.' });
  }
};

/**
 * Middleware to authorize based on specific admin roles.
 * @param  {...string} allowedRoles - Admin roles that are allowed to access the route.
 */
const authorizeAdminRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.adminUser || !req.adminUser.role) {
      return res.status(403).json({ message: 'Forbidden: Admin role not found on request.' });
    }
    if (!allowedRoles.includes(req.adminUser.role)) {
      return res.status(403).json({
        message: `Forbidden: Your admin role ('${req.adminUser.role}') is not authorized for this resource. Allowed: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = {
  adminProtect,
  authorizeAdminRoles,
};
