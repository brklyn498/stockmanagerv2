import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from './password.js';

describe('Password Utility', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // bcrypt uses random salt
    });

    it('should handle empty password', async () => {
      const password = '';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should handle long passwords', async () => {
      const password = 'a'.repeat(200);
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should handle special characters in password', async () => {
      const password = '!@#$%^&*()_+-={}[]|:";\'<>?,./~`';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword('TESTPASSWORD123', hash);

      expect(isMatch).toBe(false);
    });

    it('should return false for empty password against valid hash', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword('', hash);

      expect(isMatch).toBe(false);
    });

    it('should handle whitespace differences', async () => {
      const password = 'test password';
      const hash = await hashPassword(password);
      const isMatchWithSpace = await comparePassword('test password', hash);
      const isMatchWithoutSpace = await comparePassword('testpassword', hash);

      expect(isMatchWithSpace).toBe(true);
      expect(isMatchWithoutSpace).toBe(false);
    });

    it('should work with special characters', async () => {
      const password = 'p@$$w0rd!#123';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword('p@$$w0rd!#123', hash);

      expect(isMatch).toBe(true);
    });

    it('should handle invalid hash format gracefully', async () => {
      const password = 'testPassword123';
      const invalidHash = 'not-a-valid-hash';

      // bcrypt returns false for invalid hash rather than throwing
      const result = await comparePassword(password, invalidHash);
      expect(result).toBe(false);
    });
  });

  describe('Password Security', () => {
    it('should produce bcrypt hash format (starts with $2)', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(hash.startsWith('$2')).toBe(true);
    });

    it('should produce hashes of consistent length', async () => {
      const password1 = 'short';
      const password2 = 'a'.repeat(100);

      const hash1 = await hashPassword(password1);
      const hash2 = await hashPassword(password2);

      expect(hash1.length).toBe(hash2.length);
      expect(hash1.length).toBe(60); // bcrypt hashes are 60 characters
    });
  });
});
