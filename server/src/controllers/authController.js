const validator = require('validator');
const userModel = require('../models/userModel');
const { comparePassword } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/jwtUtils');

/**
 * Handles user registration (signup).
 * POST /api/auth/signup
 */
const signup = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, companyName } = req.body;

    // Basic Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }
    if (password.length < 6) { // Example: Minimum password length
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Check if user already exists
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // Create user
    const newUser = await userModel.createUser({
      email,
      password,
      firstName,
      lastName,
      companyName,
    });

    // Generate JWT
    const tokenPayload = {
      id: newUser.id,
      email: newUser.email,
      // Add roles or other relevant info here if needed in the future
    };
    const token = generateToken(tokenPayload);

    // Omit password_hash from the response
    const { password_hash, ...userResponse } = newUser;


    res.status(201).json({
      message: 'User registered successfully.',
      user: userResponse, // Send back user info (without password hash)
      token,
    });
  } catch (error) {
    console.error('Signup Error:', error);
    // Check for specific errors from userModel.createUser if it throws custom errors
    if (error.message.includes('already exists')) { // Crude check, improve with error codes/types
        return res.status(409).json({ message: error.message });
    }
    next(error); // Pass to global error handler
  }
};

/**
 * Handles user login.
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Basic Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    // Find user by email
    // In a real app, userModel.findUserByEmail would fetch password_hash too
    // For the in-memory store, we need to get the user with the hash
    const userWithHash = userModel._usersInMemoryStore.find(u => u.email === email);


    if (!userWithHash) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    // Compare password
    const isMatch = await comparePassword(password, userWithHash.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
    }

    // Generate JWT
    const tokenPayload = {
      id: userWithHash.id,
      email: userWithHash.email,
    };
    const token = generateToken(tokenPayload);

    // Omit password_hash from the user object sent in response
    const { password_hash, ...userResponse } = userWithHash;

    res.status(200).json({
      message: 'Login successful.',
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Login Error:', error);
    next(error); // Pass to global error handler
  }
};

/**
 * Handles fetching the current authenticated user's profile.
 * GET /api/auth/me
 * (Requires authentication middleware)
 */
const getMe = async (req, res, next) => {
    try {
        // req.user is populated by the authMiddleware
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Not authenticated or user ID missing.' });
        }

        const userId = req.user.id;
        const user = await userModel.findUserById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Omit password_hash from the response
        const { password_hash, ...userResponse } = user;
        res.status(200).json(userResponse);

    } catch (error) {
        console.error('GetMe Error:', error);
        next(error);
    }
};


module.exports = {
  signup,
  login,
  getMe,
};
