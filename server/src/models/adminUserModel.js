// In-memory store for Admin Users
// IMPORTANT: NOT FOR PRODUCTION

const { hashPassword, comparePassword } = require('../utils/passwordUtils');

const adminUsersInMemoryStore = [];
let currentAdminId = 1;

// Pre-seed an admin user for development (REMOVE FOR PRODUCTION or use secure seeding)
const seedAdminUser = async () => {
    if (adminUsersInMemoryStore.length === 0 && process.env.NODE_ENV === 'development') {
        try {
            await createAdminUser({
                email: process.env.ADMIN_EMAIL || 'admin@example.com',
                password: process.env.ADMIN_PASSWORD || 'AdminPassword123!',
                role: 'superadmin'
            });
            console.log('Development admin user seeded.');
        } catch (error) {
            if (error.message.includes('already exists')) {
                // This is fine, means it was already seeded or created manually
                console.log('Development admin user already exists.');
            } else {
                console.error('Error seeding admin user:', error);
            }
        }
    }
};
// Call seeding immediately for dev environment.
// In a real app, this would be part of a migration/seed script.
if (process.env.NODE_ENV === 'development') {
    seedAdminUser();
}


/**
 * Creates a new admin user.
 * @param {object} adminData - Data for the new admin user.
 * @param {string} adminData.email - Admin's email.
 * @param {string} adminData.password - Admin's plaintext password.
 * @param {string} [adminData.role='admin'] - Role of the admin.
 * @returns {Promise<object>} - The created admin user object (without password hash).
 */
const createAdminUser = async (adminData) => {
  const { email, password, role = 'admin' } = adminData;

  if (!email || !password) {
    throw new Error('Email and password are required to create an admin user.');
  }
  // Basic password strength check (example)
  if (password.length < 8) {
      throw new Error('Admin password must be at least 8 characters long.');
  }

  const existingAdmin = await findAdminUserByEmail(email);
  if (existingAdmin) {
    throw new Error('Admin user with this email already exists.');
  }

  const hashedPassword = await hashPassword(password);

  const newAdmin = {
    id: currentAdminId++,
    email,
    password_hash: hashedPassword,
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  adminUsersInMemoryStore.push(newAdmin);
  const { password_hash, ...adminWithoutPassword } = newAdmin;
  return adminWithoutPassword;
};

/**
 * Finds an admin user by their email.
 * Returns the full admin object including password_hash for login comparison.
 * @param {string} email - The email of the admin user to find.
 * @returns {Promise<object|null>} - The admin user object or null if not found.
 */
const findAdminUserByEmailWithPassword = async (email) => {
  const admin = adminUsersInMemoryStore.find(u => u.email === email);
  return admin ? { ...admin } : null; // Return copy
};


/**
 * Finds an admin user by their email (excluding password hash).
 * @param {string} email - The email of the admin user to find.
 * @returns {Promise<object|null>} - The admin user object (no hash) or null if not found.
 */
const findAdminUserByEmail = async (email) => {
  const admin = adminUsersInMemoryStore.find(u => u.email === email);
  if (!admin) return null;
  const { password_hash, ...adminWithoutPassword } = admin;
  return adminWithoutPassword;
};

/**
 * Finds an admin user by their ID (excluding password hash).
 * @param {number} id - The ID of the admin user to find.
 * @returns {Promise<object|null>} - The admin user object (no hash) or null if not found.
 */
const findAdminUserById = async (id) => {
  const adminId = parseInt(id, 10);
  const admin = adminUsersInMemoryStore.find(u => u.id === adminId);
  if (!admin) return null;
  const { password_hash, ...adminWithoutPassword } = admin;
  return adminWithoutPassword;
};

module.exports = {
  createAdminUser, // Keep for seeding/testing, but be careful about exposing via API
  findAdminUserByEmail,
  findAdminUserByEmailWithPassword, // Specifically for login
  findAdminUserById,
  // For testing/inspection
  _adminUsersInMemoryStore: adminUsersInMemoryStore,
  _resetAdminUsersInMemoryStore: () => {
    adminUsersInMemoryStore.length = 0;
    currentAdminId = 1;
    if (process.env.NODE_ENV === 'development') seedAdminUser(); // Re-seed if reset during dev
  }
};
