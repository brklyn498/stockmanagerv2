import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authMiddleware, requireRole, AuthRequest } from './auth.js';
import { generateToken } from '../utils/jwt.js';

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  describe('authMiddleware', () => {
    it('should pass authentication with valid token', () => {
      const token = generateToken({
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe('123');
      expect(mockRequest.user?.email).toBe('test@example.com');
      expect(mockRequest.user?.role).toBe('USER');
    });

    it('should reject request without authorization header', () => {
      authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token-here',
      };

      authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with empty token', () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject token with wrong signature', () => {
      // Create token with wrong secret
      const jwt = require('jsonwebtoken');
      const badToken = jwt.sign(
        { userId: '123', email: 'test@example.com', role: 'USER' },
        'wrong-secret',
        { expiresIn: '7d' }
      );

      mockRequest.headers = {
        authorization: `Bearer ${badToken}`,
      };

      authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should extract user data from token', () => {
      const userData = {
        userId: '456',
        email: 'admin@example.com',
        role: 'ADMIN',
      };

      const token = generateToken(userData);
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(expect.objectContaining(userData));
    });

    it('should handle tokens with different roles', () => {
      const roles = ['USER', 'ADMIN', 'STAFF'];

      roles.forEach(role => {
        const token = generateToken({
          userId: '123',
          email: 'test@example.com',
          role,
        });

        mockRequest.headers = {
          authorization: `Bearer ${token}`,
        };

        authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

        expect(mockRequest.user?.role).toBe(role);
      });
    });

    it('should be case-sensitive for Bearer prefix', () => {
      const token = generateToken({
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
      });

      mockRequest.headers = {
        authorization: `bearer ${token}`, // lowercase
      };

      authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' });
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      // Setup authenticated request
      mockRequest.user = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER',
      };
    });

    it('should allow access for matching role', () => {
      const middleware = requireRole('USER');

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for non-matching role', () => {
      const middleware = requireRole('ADMIN');

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow access if role is in allowed list', () => {
      const middleware = requireRole('ADMIN', 'USER', 'STAFF');

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access if role is not in allowed list', () => {
      const middleware = requireRole('ADMIN', 'STAFF');

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
      });
    });

    it('should deny access if user is not authenticated', () => {
      mockRequest.user = undefined;
      const middleware = requireRole('USER');

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should work with single role', () => {
      const middleware = requireRole('USER');

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should work with multiple roles', () => {
      mockRequest.user!.role = 'ADMIN';
      const middleware = requireRole('USER', 'ADMIN', 'STAFF');

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should be case-sensitive for roles', () => {
      mockRequest.user!.role = 'USER';
      const middleware = requireRole('user'); // lowercase

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny if no roles provided', () => {
      const middleware = requireRole();

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should work for ADMIN role', () => {
      mockRequest.user!.role = 'ADMIN';
      const middleware = requireRole('ADMIN');

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should work for STAFF role', () => {
      mockRequest.user!.role = 'STAFF';
      const middleware = requireRole('STAFF');

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow ADMIN to access ADMIN endpoints', () => {
      mockRequest.user!.role = 'ADMIN';
      const middleware = requireRole('ADMIN');

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should prevent USER from accessing ADMIN endpoints', () => {
      mockRequest.user!.role = 'USER';
      const middleware = requireRole('ADMIN');

      middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('should work in sequence: authenticate then check role', () => {
      const token = generateToken({
        userId: '123',
        email: 'admin@example.com',
        role: 'ADMIN',
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // First middleware: authenticate
      authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();

      // Reset mockNext
      mockNext = vi.fn();

      // Second middleware: check role
      const roleMiddleware = requireRole('ADMIN');
      roleMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should block user with valid token but insufficient role', () => {
      const token = generateToken({
        userId: '123',
        email: 'user@example.com',
        role: 'USER',
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      // Authenticate
      authMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      expect(mockRequest.user?.role).toBe('USER');

      // Reset mocks
      mockNext = vi.fn();
      mockResponse.status = vi.fn().mockReturnThis();
      mockResponse.json = vi.fn();

      // Check role (should fail)
      const roleMiddleware = requireRole('ADMIN');
      roleMiddleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
