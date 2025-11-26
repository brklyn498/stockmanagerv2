import { beforeAll, afterAll, afterEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';

// Setup hooks
beforeAll(async () => {
  // Generate Prisma Client
  await execAsync('npx prisma generate');

  // Push schema to test database
  await execAsync('npx prisma db push --skip-generate');
});

afterAll(async () => {
  // Cleanup can be added here if needed
});

// Clear all mocks after each test
afterEach(() => {
  // Reset any global state if needed
});
