import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import {
  clearDatabase,
  createTestUser,
  createTestProduct,
  generateTestToken,
  createAuthHeader,
  prisma,
} from '../test/helpers.js';
import { getStockMovements, createStockMovement } from './stockMovementController.js';
import { authMiddleware } from '../middleware/auth.js';

describe('Stock Movement Controller', () => {
  let app: Express;
  let authToken: string;
  let user: any;
  let product: any;

  beforeEach(async () => {
    await clearDatabase();

    // Create test user
    user = await createTestUser({ role: 'USER' });
    authToken = generateTestToken(user);

    // Create test product with initial quantity
    product = await createTestProduct({ quantity: 100 });

    // Setup Express app
    app = express();
    app.use(express.json());
    app.get('/stock-movements', authMiddleware, getStockMovements);
    app.post('/stock-movements', authMiddleware, createStockMovement);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe('GET /stock-movements', () => {
    it('should return all stock movements', async () => {
      // Create some stock movements
      await prisma.stockMovement.create({
        data: {
          type: 'IN',
          quantity: 10,
          productId: product.id,
          userId: user.id,
        },
      });

      const response = await request(app)
        .get('/stock-movements')
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(200);
      expect(response.body.movements).toHaveLength(1);
      expect(response.body.movements[0].type).toBe('IN');
      expect(response.body.movements[0].quantity).toBe(10);
    });

    it('should filter by productId', async () => {
      const product2 = await createTestProduct();

      await prisma.stockMovement.create({
        data: {
          type: 'IN',
          quantity: 10,
          productId: product.id,
          userId: user.id,
        },
      });

      await prisma.stockMovement.create({
        data: {
          type: 'OUT',
          quantity: 5,
          productId: product2.id,
          userId: user.id,
        },
      });

      const response = await request(app)
        .get(`/stock-movements?productId=${product.id}`)
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(200);
      expect(response.body.movements).toHaveLength(1);
      expect(response.body.movements[0].productId).toBe(product.id);
    });

    it('should filter by type', async () => {
      await prisma.stockMovement.create({
        data: {
          type: 'IN',
          quantity: 10,
          productId: product.id,
          userId: user.id,
        },
      });

      await prisma.stockMovement.create({
        data: {
          type: 'OUT',
          quantity: 5,
          productId: product.id,
          userId: user.id,
        },
      });

      const response = await request(app)
        .get('/stock-movements?type=IN')
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(200);
      expect(response.body.movements).toHaveLength(1);
      expect(response.body.movements[0].type).toBe('IN');
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/stock-movements');

      expect(response.status).toBe(401);
    });

    it('should include product and user details', async () => {
      await prisma.stockMovement.create({
        data: {
          type: 'IN',
          quantity: 10,
          productId: product.id,
          userId: user.id,
        },
      });

      const response = await request(app)
        .get('/stock-movements')
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(200);
      expect(response.body.movements[0].product).toBeDefined();
      expect(response.body.movements[0].product.name).toBe(product.name);
      expect(response.body.movements[0].user).toBeDefined();
      expect(response.body.movements[0].user.name).toBe(user.name);
    });

    it('should order by createdAt descending', async () => {
      // Create movements with slight delay
      await prisma.stockMovement.create({
        data: {
          type: 'IN',
          quantity: 10,
          productId: product.id,
          userId: user.id,
          createdAt: new Date('2024-01-01'),
        },
      });

      await prisma.stockMovement.create({
        data: {
          type: 'OUT',
          quantity: 5,
          productId: product.id,
          userId: user.id,
          createdAt: new Date('2024-01-02'),
        },
      });

      const response = await request(app)
        .get('/stock-movements')
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(200);
      expect(response.body.movements[0].type).toBe('OUT'); // Most recent first
      expect(response.body.movements[1].type).toBe('IN');
    });
  });

  describe('POST /stock-movements', () => {
    describe('IN movement type', () => {
      it('should increase stock quantity', async () => {
        const initialQuantity = product.quantity;

        const response = await request(app)
          .post('/stock-movements')
          .set(createAuthHeader(authToken))
          .send({
            type: 'IN',
            quantity: 50,
            productId: product.id,
            reason: 'Purchase',
            reference: 'PO-001',
          });

        expect(response.status).toBe(201);
        expect(response.body.movement.type).toBe('IN');
        expect(response.body.movement.quantity).toBe(50);

        // Verify product quantity updated
        const updatedProduct = await prisma.product.findUnique({
          where: { id: product.id },
        });
        expect(updatedProduct?.quantity).toBe(initialQuantity + 50);
      });
    });

    describe('OUT movement type', () => {
      it('should decrease stock quantity', async () => {
        const initialQuantity = product.quantity;

        const response = await request(app)
          .post('/stock-movements')
          .set(createAuthHeader(authToken))
          .send({
            type: 'OUT',
            quantity: 30,
            productId: product.id,
            reason: 'Sale',
            reference: 'SO-001',
          });

        expect(response.status).toBe(201);
        expect(response.body.movement.type).toBe('OUT');

        const updatedProduct = await prisma.product.findUnique({
          where: { id: product.id },
        });
        expect(updatedProduct?.quantity).toBe(initialQuantity - 30);
      });

      it('should reject if insufficient stock', async () => {
        const response = await request(app)
          .post('/stock-movements')
          .set(createAuthHeader(authToken))
          .send({
            type: 'OUT',
            quantity: 200, // More than available (100)
            productId: product.id,
            reason: 'Sale',
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Insufficient stock');

        // Verify product quantity unchanged
        const updatedProduct = await prisma.product.findUnique({
          where: { id: product.id },
        });
        expect(updatedProduct?.quantity).toBe(100);
      });
    });

    describe('RETURN movement type', () => {
      it('should increase stock quantity', async () => {
        const initialQuantity = product.quantity;

        const response = await request(app)
          .post('/stock-movements')
          .set(createAuthHeader(authToken))
          .send({
            type: 'RETURN',
            quantity: 20,
            productId: product.id,
            reason: 'Customer return',
          });

        expect(response.status).toBe(201);

        const updatedProduct = await prisma.product.findUnique({
          where: { id: product.id },
        });
        expect(updatedProduct?.quantity).toBe(initialQuantity + 20);
      });
    });

    describe('DAMAGED movement type', () => {
      it('should decrease stock quantity', async () => {
        const initialQuantity = product.quantity;

        const response = await request(app)
          .post('/stock-movements')
          .set(createAuthHeader(authToken))
          .send({
            type: 'DAMAGED',
            quantity: 10,
            productId: product.id,
            reason: 'Damaged during storage',
          });

        expect(response.status).toBe(201);

        const updatedProduct = await prisma.product.findUnique({
          where: { id: product.id },
        });
        expect(updatedProduct?.quantity).toBe(initialQuantity - 10);
      });

      it('should reject if would result in negative stock', async () => {
        const response = await request(app)
          .post('/stock-movements')
          .set(createAuthHeader(authToken))
          .send({
            type: 'DAMAGED',
            quantity: 150,
            productId: product.id,
            reason: 'Damaged',
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Insufficient stock');
      });
    });

    describe('ADJUSTMENT movement type', () => {
      it('should set stock to exact quantity', async () => {
        const response = await request(app)
          .post('/stock-movements')
          .set(createAuthHeader(authToken))
          .send({
            type: 'ADJUSTMENT',
            quantity: 75,
            productId: product.id,
            reason: 'Stock count adjustment',
          });

        expect(response.status).toBe(201);

        const updatedProduct = await prisma.product.findUnique({
          where: { id: product.id },
        });
        expect(updatedProduct?.quantity).toBe(75); // Exact value, not relative
      });

      it('should allow adjustment to zero', async () => {
        const response = await request(app)
          .post('/stock-movements')
          .set(createAuthHeader(authToken))
          .send({
            type: 'ADJUSTMENT',
            quantity: 0,
            productId: product.id,
            reason: 'Clear stock',
          });

        expect(response.status).toBe(201);

        const updatedProduct = await prisma.product.findUnique({
          where: { id: product.id },
        });
        expect(updatedProduct?.quantity).toBe(0);
      });

      it('should reject negative adjustment quantity', async () => {
        const response = await request(app)
          .post('/stock-movements')
          .set(createAuthHeader(authToken))
          .send({
            type: 'ADJUSTMENT',
            quantity: -10,
            productId: product.id,
            reason: 'Adjustment',
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Insufficient stock');
      });
    });

    describe('Transaction safety', () => {
      it('should create movement record and update product in transaction', async () => {
        const response = await request(app)
          .post('/stock-movements')
          .set(createAuthHeader(authToken))
          .send({
            type: 'IN',
            quantity: 25,
            productId: product.id,
            reason: 'Purchase',
          });

        expect(response.status).toBe(201);

        // Verify both movement and product were updated
        const movements = await prisma.stockMovement.findMany({
          where: { productId: product.id },
        });
        expect(movements).toHaveLength(1);

        const updatedProduct = await prisma.product.findUnique({
          where: { id: product.id },
        });
        expect(updatedProduct?.quantity).toBe(125);
      });

      it('should not create movement if product not found', async () => {
        const response = await request(app)
          .post('/stock-movements')
          .set(createAuthHeader(authToken))
          .send({
            type: 'IN',
            quantity: 25,
            productId: 'non-existent-id-12345', // Non-existent product
            reason: 'Purchase',
          });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Product not found');

        // Verify no movement was created
        const movements = await prisma.stockMovement.findMany();
        expect(movements).toHaveLength(0);
      });
    });

    describe('Authentication and authorization', () => {
      it('should require authentication', async () => {
        const response = await request(app).post('/stock-movements').send({
          type: 'IN',
          quantity: 25,
          productId: product.id,
        });

        expect(response.status).toBe(401);
      });

      it('should record the user who created the movement', async () => {
        const response = await request(app)
          .post('/stock-movements')
          .set(createAuthHeader(authToken))
          .send({
            type: 'IN',
            quantity: 25,
            productId: product.id,
            reason: 'Purchase',
          });

        expect(response.status).toBe(201);
        expect(response.body.movement.userId).toBe(user.id);
        expect(response.body.movement.user.name).toBe(user.name);
      });
    });

    describe('Edge cases', () => {
      it('should handle movement with no reason', async () => {
        const response = await request(app)
          .post('/stock-movements')
          .set(createAuthHeader(authToken))
          .send({
            type: 'IN',
            quantity: 10,
            productId: product.id,
          });

        expect(response.status).toBe(201);
        expect(response.body.movement.reason).toBeNull();
      });

      it('should handle movement with no reference', async () => {
        const response = await request(app)
          .post('/stock-movements')
          .set(createAuthHeader(authToken))
          .send({
            type: 'OUT',
            quantity: 10,
            productId: product.id,
            reason: 'Sale',
          });

        expect(response.status).toBe(201);
        expect(response.body.movement.reference).toBeNull();
      });

      it('should handle exact stock depletion', async () => {
        const response = await request(app)
          .post('/stock-movements')
          .set(createAuthHeader(authToken))
          .send({
            type: 'OUT',
            quantity: 100, // Exact current quantity
            productId: product.id,
            reason: 'Clear stock',
          });

        expect(response.status).toBe(201);

        const updatedProduct = await prisma.product.findUnique({
          where: { id: product.id },
        });
        expect(updatedProduct?.quantity).toBe(0);
      });
    });
  });
});
