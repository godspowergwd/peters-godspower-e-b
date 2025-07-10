const validator = require('validator');
const adminUserModel = require('../models/adminUserModel');
const { comparePassword } = require('../utils/passwordUtils');
const { generateToken, verifyToken } = require('../utils/jwtUtils'); // Using the same JWT utils

// POST /api/admin/auth/login
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    const adminUser = await adminUserModel.findAdminUserByEmailWithPassword(email);
    if (!adminUser) {
      return res.status(401).json({ message: 'Invalid credentials. Admin user not found.' });
    }

    const isMatch = await comparePassword(password, adminUser.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
    }

    // Generate JWT - explicitly add an admin marker/role
    const tokenPayload = {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role, // Include admin's role
      type: 'admin', // Differentiator for admin tokens
    };
    // Consider a shorter expiry for admin tokens if desired, or use a different secret
    const token = generateToken(tokenPayload, process.env.JWT_ADMIN_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '1h');

    const { password_hash, ...adminResponse } = adminUser;

    res.status(200).json({
      message: 'Admin login successful.',
      admin: adminResponse,
      token,
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    next(error);
  }
};

// GET /api/admin/auth/me - Get current logged-in admin's profile
const getAdminMe = async (req, res, next) => {
    try {
        // req.adminUser should be populated by adminProtect middleware
        if (!req.adminUser || !req.adminUser.id) {
            return res.status(401).json({ message: 'Not authenticated as admin or admin user ID missing.' });
        }
        // The req.adminUser object already comes from findAdminUserById (which excludes hash)
        res.status(200).json(req.adminUser);
    } catch (error) {
        console.error('GetAdminMe Error:', error);
        next(error);
    }
};


// POST /api/admin/auth/logout (Conceptual - JWT logout is client-side by deleting token)
const adminLogout = (req, res) => {
  // For JWT, logout is typically handled client-side by discarding the token.
  // If using server-side sessions or a token blocklist, implement that here.
  res.status(200).json({ message: 'Admin logged out successfully (client should clear token).' });
};

module.exports = {
  adminLogin,
  getAdminMe,
  adminLogout,
};
