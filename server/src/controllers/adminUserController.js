const userModel = require('../models/userModel'); // Model for regular users
const adminUserModel = require('../models/adminUserModel'); // Just in case, though not directly used here for user ops

// GET /api/admin/users - List all regular users
const listUsers = async (req, res, next) => {
  try {
    // In a real app, you'd implement pagination here.
    // For the in-memory store, userModel._usersInMemoryStore contains all users.
    // We need to ensure we don't send password hashes.
    const allUsersWithHashes = userModel._usersInMemoryStore; // Direct access for in-memory
    const users = allUsersWithHashes.map(u => {
      const { password_hash, ...userWithoutHash } = u;
      return userWithoutHash;
    });
    res.status(200).json(users);
  } catch (error) {
    console.error('Admin: Error listing users:', error);
    next(error);
  }
};

// GET /api/admin/users/:userId - Get details of a specific regular user
const getUserById = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    const user = await userModel.findUserById(userId); // This should not return password hash
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    // Ensure password_hash is not present if findUserById accidentally included it
    const { password_hash, ...userWithoutHash } = user;
    res.status(200).json(userWithoutHash);
  } catch (error) {
    console.error(`Admin: Error fetching user ${req.params.userId}:`, error);
    next(error);
  }
};

// PUT /api/admin/users/:userId - Update a regular user's details
const updateUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const updateData = req.body; // e.g., { email, first_name, last_name, company_name, subscription_status, active_plan_id }

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No update data provided.' });
    }

    // For in-memory store, directly find and update
    const userIndex = userModel._usersInMemoryStore.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prevent updating certain fields like password or id directly here
    delete updateData.id;
    delete updateData.password; // Password changes should have a separate, secure flow
    delete updateData.password_hash;
    delete updateData.created_at; // Should not be updatable

    // Example of allowed updates:
    const allowedUpdates = ['email', 'first_name', 'last_name', 'company_name', 'subscription_status', 'active_plan_id', 'stripe_customer_id', 'stripe_subscription_id'];
    const finalUpdateData = {};
    for (const key of allowedUpdates) {
        if (updateData[key] !== undefined) {
            finalUpdateData[key] = updateData[key];
        }
    }

    if (Object.keys(finalUpdateData).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update.' });
    }


    const updatedUser = {
      ...userModel._usersInMemoryStore[userIndex],
      ...finalUpdateData,
      updated_at: new Date().toISOString(),
    };
    userModel._usersInMemoryStore[userIndex] = updatedUser;

    const { password_hash, ...userWithoutHash } = updatedUser;
    res.status(200).json(userWithoutHash);

  } catch (error) {
    console.error(`Admin: Error updating user ${req.params.userId}:`, error);
    if (error.message.includes('User with this email already exists') && error.code === 'DUPLICATE_EMAIL') { // Example custom error
        return res.status(409).json({ message: error.message });
    }
    next(error);
  }
};

// DELETE /api/admin/users/:userId - Delete a regular user
const deleteUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    // For in-memory store, find index and splice
    const userIndex = userModel._usersInMemoryStore.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // TODO: Consider what happens to user's associated data (landing pages, leads, etc.)
    // This is a hard delete. Soft delete (marking as inactive) is often preferred.
    userModel._usersInMemoryStore.splice(userIndex, 1);

    // Re-assign IDs if necessary for in-memory store if IDs are sequential and reused (not the case here with incrementing ID)

    res.status(204).send(); // No content
  } catch (error) {
    console.error(`Admin: Error deleting user ${req.params.userId}:`, error);
    next(error);
  }
};

module.exports = {
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
};
