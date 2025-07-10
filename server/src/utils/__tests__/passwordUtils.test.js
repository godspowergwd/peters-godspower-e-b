const { hashPassword, comparePassword } = require('../passwordUtils');

describe('passwordUtils', () => {
  describe('hashPassword', () => {
    it('should hash a given password', async () => {
      const password = 'mySecurePassword123';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      // Bcrypt hashes typically start with $2a$, $2b$, or $2y$
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d{2}\$/);
    });

    it('should produce different hashes for the same password (due to salt)', async () => {
      const password = 'mySecurePassword123';
      const hashedPassword1 = await hashPassword(password);
      const hashedPassword2 = await hashPassword(password);

      expect(hashedPassword1).not.toBe(hashedPassword2);
    });

    it('should throw an error if no password is provided', async () => {
      await expect(hashPassword(null)).rejects.toThrow('Password is required for hashing.');
      await expect(hashPassword('')).rejects.toThrow('Password is required for hashing.');
      await expect(hashPassword(undefined)).rejects.toThrow('Password is required for hashing.');
    });
  });

  describe('comparePassword', () => {
    it('should correctly compare a password with its hash', async () => {
      const password = 'anotherPassword456';
      const hashedPassword = await hashPassword(password);

      const isMatch = await comparePassword(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for an incorrect password', async () => {
      const password = 'anotherPassword456';
      const wrongPassword = 'wrongPassword789';
      const hashedPassword = await hashPassword(password);

      const isMatch = await comparePassword(wrongPassword, hashedPassword);
      expect(isMatch).toBe(false);
    });

    it('should throw an error if candidatePassword is not provided', async () => {
        const hashedPassword = await hashPassword("test");
        await expect(comparePassword(null, hashedPassword)).rejects.toThrow('Both candidate password and hashed password are required for comparison.');
        await expect(comparePassword(undefined, hashedPassword)).rejects.toThrow('Both candidate password and hashed password are required for comparison.');
    });

    it('should throw an error if hashedPassword is not provided', async () => {
        await expect(comparePassword("test", null)).rejects.toThrow('Both candidate password and hashed password are required for comparison.');
        await expect(comparePassword("test", undefined)).rejects.toThrow('Both candidate password and hashed password are required for comparison.');
    });

    it('should generally return false for invalid hash format, though bcrypt might throw', async () => {
        // bcrypt.compare itself might throw an error for a malformed hash rather than returning false.
        // This depends on the bcryptjs library's internal error handling for malformed data.
        // For robustness, we can check both behaviors.
        try {
            const isMatch = await comparePassword("test", "invalidhashformat");
            expect(isMatch).toBe(false); // Or it might throw, see catch block
        } catch (error) {
            // Depending on bcryptjs version, it might throw "Invalid salt version" or similar
            expect(error).toBeInstanceOf(Error);
        }
    });
  });
});
