const bcrypt = require('bcryptjs');

/**
 * Hashes a password using bcrypt.
 * @param {string} password - The plaintext password.
 * @returns {Promise<string>} - A promise that resolves to the hashed password.
 */
const hashPassword = async (password) => {
  if (!password) {
    throw new Error('Password is required for hashing.');
  }
  const salt = await bcrypt.genSalt(10); // 10 rounds is generally considered secure
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

/**
 * Compares a plaintext password with a hashed password.
 * @param {string} candidatePassword - The plaintext password to check.
 * @param {string} hashedPassword - The stored hashed password.
 * @returns {Promise<boolean>} - A promise that resolves to true if passwords match, false otherwise.
 */
const comparePassword = async (candidatePassword, hashedPassword) => {
  if (!candidatePassword || !hashedPassword) {
    throw new Error('Both candidate password and hashed password are required for comparison.');
  }
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword,
};
