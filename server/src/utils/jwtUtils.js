const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined. Please set it in your .env file.');
}

/**
 * Generates a JWT for a given user payload.
 * @param {object} payload - The payload to include in the token (typically user ID, email, role).
 * @param {string} [expiresIn] - Optional expiration time (e.g., '1h', '7d'). Defaults to JWT_EXPIRES_IN.
 * @returns {string} - The generated JSON Web Token.
 */
const generateToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a non-empty object.');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Verifies a JWT and returns its decoded payload.
 * @param {string} token - The JSON Web Token to verify.
 * @returns {Promise<object|null>} - A promise that resolves to the decoded payload if valid, or null if invalid/expired.
 */
const verifyToken = (token) => {
  if (!token) {
    return null;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    // Handle specific errors like TokenExpiredError, JsonWebTokenError if needed
    console.error('JWT Verification Error:', error.message);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
