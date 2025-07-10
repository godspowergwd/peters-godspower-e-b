// const db = require('../config/database'); // Placeholder for actual database connection
const { hashPassword } = require('../utils/passwordUtils');

// This is a placeholder. In a real application, this would interact with a database.
// For now, we'll use an in-memory store for demonstration.
// IMPORTANT: THIS IS NOT SUITABLE FOR PRODUCTION.
const usersInMemoryStore = [];
let currentId = 1;

/**
 * Finds a user by their email.
 * @param {string} email - The email of the user to find.
 * @returns {Promise<object|null>} - A promise that resolves to the user object or null if not found.
 */
const findUserByEmail = async (email) => {
  // In a real app: await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = usersInMemoryStore.find(u => u.email === email);
  return user || null;
};

/**
 * Finds a user by their ID.
 * @param {number} id - The ID of the user to find.
 * @returns {Promise<object|null>} - A promise that resolves to the user object or null if not found.
 */
const findUserById = async (id) => {
  // In a real app: await db.query('SELECT * FROM users WHERE id = $1', [id]);
  const user = usersInMemoryStore.find(u => u.id === id);
  return user || null;
};

/**
 * Creates a new user.
 * @param {object} userData - The user data (e.g., email, password, first_name, last_name).
 * @returns {Promise<object>} - A promise that resolves to the newly created user object.
 */
const createUser = async (userData) => {
  const { email, password, firstName, lastName, companyName } = userData;

  if (!email || !password) {
    throw new Error('Email and password are required to create a user.');
  }

  // Check if user already exists (in a real app, database would handle unique constraint)
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  const hashedPassword = await hashPassword(password);

  const newUser = {
    id: currentId++,
    email,
    password_hash: hashedPassword,
    first_name: firstName || null,
    last_name: lastName || null,
    company_name: companyName || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stripe_customer_id: null, // Will be populated after Stripe customer creation
    stripe_subscription_id: null, // Will be populated after successful subscription
    subscription_status: 'inactive', // e.g., inactive, active, past_due, canceled
    active_plan_id: null, // Our internal plan ID
  };

  // In a real app:
  // const result = await db.query(
  //   'INSERT INTO users (email, password_hash, first_name, last_name, company_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
  //   [newUser.email, newUser.password_hash, newUser.first_name, newUser.last_name, newUser.company_name]
  // );
  // return result.rows[0];

  usersInMemoryStore.push(newUser);
  // Return a copy without the password hash for security, as the controller might send it back
  const { password_hash, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  // Placeholder for future database interaction (used by controller to simulate DB)
  _usersInMemoryStore: usersInMemoryStore, // For testing/inspection if needed, not for direct use by controller
  _resetUsersInMemoryStore: () => { // For testing
    usersInMemoryStore.length = 0;
    currentId = 1;
  }
};
