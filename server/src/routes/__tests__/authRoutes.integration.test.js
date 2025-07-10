const request = require('supertest');
const app = require('../../app'); // The main Express app
const userModel = require('../../models/userModel'); // To reset the in-memory store

describe('Auth API (/api/auth)', () => {
  beforeEach(() => {
    // Reset the in-memory user store before each test
    userModel._resetUsersInMemoryStore();
  });

  describe('POST /api/auth/signup', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message', 'User registered successfully.');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user).not.toHaveProperty('password_hash');
      expect(res.body).toHaveProperty('token');
    });

    it('should return 400 if email or password is missing', async () => {
      const res1 = await request(app)
        .post('/api/auth/signup')
        .send({ password: 'password123' });
      expect(res1.statusCode).toEqual(400);
      expect(res1.body.message).toBe('Email and password are required.');

      const res2 = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com' });
      expect(res2.statusCode).toEqual(400);
      expect(res2.body.message).toBe('Email and password are required.');
    });

    it('should return 400 for invalid email format', async () => {
        const res = await request(app)
          .post('/api/auth/signup')
          .send({ email: 'invalidemail', password: 'password123' });
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Invalid email format.');
    });

    it('should return 400 for password too short', async () => {
        const res = await request(app)
          .post('/api/auth/signup')
          .send({ email: 'test@example.com', password: '123' });
        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe('Password must be at least 6 characters long.');
    });

    it('should return 409 if email already exists', async () => {
      await request(app) // First registration
        .post('/api/auth/signup')
        .send({ email: 'test@example.com', password: 'password123' });

      const res = await request(app) // Second registration with same email
        .post('/api/auth/signup')
        .send({ email: 'test@example.com', password: 'anotherPassword' });
      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toBe('User with this email already exists.');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Ensure a user exists for login tests
      await request(app)
        .post('/api/auth/signup')
        .send({ email: 'loginuser@example.com', password: 'password123' });
    });

    it('should login an existing user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'loginuser@example.com', password: 'password123' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Login successful.');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('loginuser@example.com');
      expect(res.body).toHaveProperty('token');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nouser@example.com', password: 'password123' });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Invalid credentials. User not found.');
    });

    it('should return 401 for incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'loginuser@example.com', password: 'wrongpassword' });
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Invalid credentials. Password incorrect.');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;
    let userId;

    beforeEach(async () => {
      // Signup and login a user to get a token
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'me@example.com', password: 'password123', firstName: 'Me' });
      userId = signupRes.body.user.id;

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'me@example.com', password: 'password123' });
      token = loginRes.body.token;
    });

    it('should return current user details for a valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', userId);
      expect(res.body).toHaveProperty('email', 'me@example.com');
      expect(res.body).toHaveProperty('first_name', 'Me');
      expect(res.body).not.toHaveProperty('password_hash');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('Not authorized, no token provided.');
    });

    it('should return 401 if token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');
      expect(res.statusCode).toEqual(401);
      // This is the message from the protect middleware when token decoding fails to yield a user ID
      expect(res.body.message).toBe('Not authorized, token failed or user ID missing in token.');
    });

    // it('should return 401 if token is expired', async () => {
    //   // This test requires manipulating time or using a very short-lived token
    //   // For now, this is harder to test reliably without more setup.
    // });
  });
});
