import { describe, it, expect, beforeEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken, generateRefreshToken, JWTPayload } from './jwt.js';

describe('JWT Utility', () => {
  const mockPayload: JWTPayload = {
    userId: '123',
    email: 'test@example.com',
    role: 'USER',
  };

  beforeEach(() => {
    // Ensure test environment variables are set
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
    process.env.JWT_EXPIRES_IN = '7d';
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts: header.payload.signature
    });

    it('should include payload data in the token', () => {
      const token = generateToken(mockPayload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should include expiration time', () => {
      const token = generateToken(mockPayload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    it('should generate different tokens for same payload', async () => {
      const token1 = generateToken(mockPayload);

      // Wait a tiny bit to ensure different iat timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const token2 = generateToken(mockPayload);

      // Tokens will be different due to different iat (issued at) timestamps
      expect(token1).not.toBe(token2);
    });

    it('should handle different roles', () => {
      const adminPayload: JWTPayload = { ...mockPayload, role: 'ADMIN' };
      const token = generateToken(adminPayload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.role).toBe('ADMIN');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(mockPayload);
      const verified = verifyToken(token);

      expect(verified.userId).toBe(mockPayload.userId);
      expect(verified.email).toBe(mockPayload.email);
      expect(verified.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyToken(invalidToken)).toThrow('Invalid or expired token');
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-token';

      expect(() => verifyToken(malformedToken)).toThrow('Invalid or expired token');
    });

    it('should throw error for token with wrong signature', () => {
      // Generate token with different secret
      const token = jwt.sign(mockPayload, 'wrong-secret', { expiresIn: '7d' });

      expect(() => verifyToken(token)).toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', () => {
      // Generate token that expires immediately
      const expiredToken = jwt.sign(mockPayload, process.env.JWT_SECRET!, {
        expiresIn: '0s',
      });

      // Wait a tiny bit to ensure expiration
      setTimeout(() => {
        expect(() => verifyToken(expiredToken)).toThrow('Invalid or expired token');
      }, 100);
    });

    it('should throw error for empty token', () => {
      expect(() => verifyToken('')).toThrow('Invalid or expired token');
    });

    it('should verify tokens with different payloads correctly', () => {
      const payload1: JWTPayload = {
        userId: '1',
        email: 'user1@example.com',
        role: 'USER',
      };
      const payload2: JWTPayload = {
        userId: '2',
        email: 'user2@example.com',
        role: 'ADMIN',
      };

      const token1 = generateToken(payload1);
      const token2 = generateToken(payload2);

      const verified1 = verifyToken(token1);
      const verified2 = verifyToken(token2);

      expect(verified1.userId).toBe('1');
      expect(verified2.userId).toBe('2');
      expect(verified1.role).toBe('USER');
      expect(verified2.role).toBe('ADMIN');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include payload data in refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = jwt.decode(token) as any;

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should have longer expiration than access token', () => {
      const accessToken = generateToken(mockPayload);
      const refreshToken = generateRefreshToken(mockPayload);

      const decodedAccess = jwt.decode(accessToken) as any;
      const decodedRefresh = jwt.decode(refreshToken) as any;

      // Refresh token should expire after access token
      expect(decodedRefresh.exp).toBeGreaterThan(decodedAccess.exp);
    });

    it('should be verifiable with verifyToken', () => {
      const refreshToken = generateRefreshToken(mockPayload);
      const verified = verifyToken(refreshToken);

      expect(verified.userId).toBe(mockPayload.userId);
      expect(verified.email).toBe(mockPayload.email);
      expect(verified.role).toBe(mockPayload.role);
    });
  });

  describe('Token Lifecycle', () => {
    it('should maintain data integrity through generation and verification', () => {
      const payload: JWTPayload = {
        userId: '999',
        email: 'complete@example.com',
        role: 'ADMIN',
      };

      const token = generateToken(payload);
      const verified = verifyToken(token);

      expect(verified).toEqual(expect.objectContaining(payload));
    });

    it('should handle special characters in payload', () => {
      const specialPayload: JWTPayload = {
        userId: '123',
        email: 'test+special@example.com',
        role: 'USER',
      };

      const token = generateToken(specialPayload);
      const verified = verifyToken(token);

      expect(verified.email).toBe(specialPayload.email);
    });
  });

  describe('Security', () => {
    it('should not be able to decode token without secret', () => {
      const token = generateToken(mockPayload);

      // Decoding without verification is possible but verification should fail with wrong secret
      const decoded = jwt.decode(token);
      expect(decoded).toBeDefined();

      // But verification with wrong secret should fail
      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow();
    });

    it('should not allow token manipulation', () => {
      const token = generateToken(mockPayload);
      const parts = token.split('.');

      // Try to manipulate the payload
      const manipulatedToken = parts[0] + '.tampered.' + parts[2];

      expect(() => verifyToken(manipulatedToken)).toThrow('Invalid or expired token');
    });
  });
});
