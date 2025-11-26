import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { register, login, me, refresh } from './authController.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  clearDatabase,
  createTestUser,
  generateTestToken,
  createAuthHeader,
  prisma,
} from '../test/helpers.js';
import { generateRefreshToken } from '../utils/jwt.js';

describe('Auth Controller', () => {
  let app: Express;

  beforeEach(async () => {
    await clearDatabase();

    app = express();
    app.use(express.json());
    app.post('/auth/register', register);
    app.post('/auth/login', login);
    app.get('/auth/me', authMiddleware, me);
    app.post('/auth/refresh', refresh);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        role: 'STAFF',
      };

      const response = await request(app).post('/auth/register').send(userData);

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.role).toBe(userData.role);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('should not return password in response', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app).post('/auth/register').send(userData);

      expect(response.status).toBe(201);
      expect(response.body.user.password).toBeUndefined();
    });

    it('should hash password before storing', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      await request(app).post('/auth/register').send(userData);

      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(user?.password).toBeDefined();
      expect(user?.password).not.toBe(userData.password);
      expect(user?.password.startsWith('$2')).toBe(true); // bcrypt hash
    });

    it('should reject duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'User One',
      };

      // Register first user
      await request(app).post('/auth/register').send(userData);

      // Try to register with same email
      const response = await request(app).post('/auth/register').send({
        ...userData,
        name: 'User Two',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User already exists');
    });

    it('should default role to STAFF if not provided', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app).post('/auth/register').send(userData);

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('STAFF');
    });

    it('should allow registration with ADMIN role', async () => {
      const userData = {
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin User',
        role: 'ADMIN',
      };

      const response = await request(app).post('/auth/register').send(userData);

      expect(response.status).toBe(201);
      expect(response.body.user.role).toBe('ADMIN');
    });

    it('should return both access and refresh tokens', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app).post('/auth/register').send(userData);

      expect(response.status).toBe(201);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.token).not.toBe(response.body.refreshToken);
    });

    it('should handle special characters in email', async () => {
      const userData = {
        email: 'user+test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app).post('/auth/register').send(userData);

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe(userData.email);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await createTestUser({
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('should not return password in login response', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.user.password).toBeUndefined();
    });

    it('should reject invalid email', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'wrong@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject invalid password', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should be case-sensitive for password', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'PASSWORD123', // Wrong case
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should include user role in response', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBeDefined();
    });

    it('should generate fresh tokens on each login', async () => {
      const response1 = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      const response2 = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response1.body.token).not.toBe(response2.body.token);
      expect(response1.body.refreshToken).not.toBe(response2.body.refreshToken);
    });

    it('should not leak user existence through timing', async () => {
      // Both requests should return similar error messages
      const nonExistentResponse = await request(app).post('/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      const wrongPasswordResponse = await request(app).post('/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(nonExistentResponse.status).toBe(401);
      expect(wrongPasswordResponse.status).toBe(401);
      expect(nonExistentResponse.body.error).toBe(wrongPasswordResponse.body.error);
    });
  });

  describe('GET /auth/me', () => {
    let authToken: string;
    let user: any;

    beforeEach(async () => {
      user = await createTestUser({
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      });
      authToken = generateTestToken(user);
    });

    it('should return current user info', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(user.id);
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.user.name).toBe(user.name);
    });

    it('should not return password', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(200);
      expect(response.body.user.password).toBeUndefined();
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set({ Authorization: 'Bearer invalid-token' });

      expect(response.status).toBe(401);
    });

    it('should return 404 if user deleted', async () => {
      // Delete user
      await prisma.user.delete({ where: { id: user.id } });

      const response = await request(app)
        .get('/auth/me')
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should include user timestamps', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(200);
      expect(response.body.user.createdAt).toBeDefined();
      expect(response.body.user.updatedAt).toBeDefined();
    });
  });

  describe('POST /auth/refresh', () => {
    let user: any;
    let refreshToken: string;

    beforeEach(async () => {
      user = await createTestUser({
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      });
      refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    });

    it('should generate new tokens with valid refresh token', async () => {
      const response = await request(app).post('/auth/refresh').send({
        refreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.token).not.toBe(refreshToken);
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app).post('/auth/refresh').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Refresh token required');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app).post('/auth/refresh').send({
        refreshToken: 'invalid-token',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid refresh token');
    });

    it('should reject refresh token for deleted user', async () => {
      // Delete user
      await prisma.user.delete({ where: { id: user.id } });

      const response = await request(app).post('/auth/refresh').send({
        refreshToken,
      });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should generate different tokens on each refresh', async () => {
      const response1 = await request(app).post('/auth/refresh').send({
        refreshToken,
      });

      // Use the new refresh token
      const response2 = await request(app).post('/auth/refresh').send({
        refreshToken: response1.body.refreshToken,
      });

      expect(response1.body.token).not.toBe(response2.body.token);
      expect(response1.body.refreshToken).not.toBe(response2.body.refreshToken);
    });

    it('should maintain user role in new tokens', async () => {
      const adminUser = await createTestUser({
        email: 'admin@example.com',
        role: 'ADMIN',
      });
      const adminRefreshToken = generateRefreshToken({
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      });

      const response = await request(app).post('/auth/refresh').send({
        refreshToken: adminRefreshToken,
      });

      expect(response.status).toBe(200);

      // Verify role by using the new token to access /auth/me
      const meResponse = await request(app)
        .get('/auth/me')
        .set({ Authorization: `Bearer ${response.body.token}` });

      expect(meResponse.body.user.role).toBe('ADMIN');
    });
  });

  describe('Security', () => {
    it('should not allow SQL injection in email', async () => {
      const response = await request(app).post('/auth/login').send({
        email: "admin' OR '1'='1",
        password: 'password',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);

      const registerResponse = await request(app).post('/auth/register').send({
        email: 'longpass@example.com',
        password: longPassword,
        name: 'Test',
      });

      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app).post('/auth/login').send({
        email: 'longpass@example.com',
        password: longPassword,
      });

      expect(loginResponse.status).toBe(200);
    });

    it('should handle special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';

      const registerResponse = await request(app).post('/auth/register').send({
        email: 'special@example.com',
        password: specialPassword,
        name: 'Test',
      });

      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app).post('/auth/login').send({
        email: 'special@example.com',
        password: specialPassword,
      });

      expect(loginResponse.status).toBe(200);
    });
  });
});
