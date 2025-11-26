import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import {
  clearDatabase,
  createTestUser,
  createTestProduct,
  createTestSupplier,
  createTestOrder,
  createTestOrderItem,
  generateTestToken,
  createAuthHeader,
  prisma,
} from '../test/helpers.js';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} from './orderController.js';
import { authMiddleware } from '../middleware/auth.js';

describe('Order Controller', () => {
  let app: Express;
  let authToken: string;
  let user: any;
  let supplier: any;
  let product1: any;
  let product2: any;

  beforeEach(async () => {
    await clearDatabase();

    user = await createTestUser({ role: 'USER' });
    authToken = generateTestToken(user);
    supplier = await createTestSupplier();
    product1 = await createTestProduct({ quantity: 100, price: 50 });
    product2 = await createTestProduct({ quantity: 50, price: 30 });

    app = express();
    app.use(express.json());
    app.get('/orders', authMiddleware, getOrders);
    app.get('/orders/:id', authMiddleware, getOrder);
    app.post('/orders', authMiddleware, createOrder);
    app.patch('/orders/:id/status', authMiddleware, updateOrderStatus);
    app.delete('/orders/:id', authMiddleware, deleteOrder);
  });

  afterEach(async () => {
    await clearDatabase();
  });

  describe('GET /orders', () => {
    it('should return all orders', async () => {
      const order = await createTestOrder(user.id, { supplierId: supplier.id });
      await createTestOrderItem(order.id, product1.id);

      const response = await request(app)
        .get('/orders')
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0].orderNumber).toBe(order.orderNumber);
    });

    it('should include supplier, user, and items', async () => {
      const order = await createTestOrder(user.id, { supplierId: supplier.id });
      await createTestOrderItem(order.id, product1.id);

      const response = await request(app)
        .get('/orders')
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(200);
      expect(response.body.orders[0].supplier).toBeDefined();
      expect(response.body.orders[0].user).toBeDefined();
      expect(response.body.orders[0].items).toHaveLength(1);
    });

    it('should filter by type', async () => {
      await createTestOrder(user.id, { type: 'PURCHASE', supplierId: supplier.id });
      await createTestOrder(user.id, { type: 'SALE', supplierId: supplier.id });

      const response = await request(app)
        .get('/orders?type=PURCHASE')
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0].type).toBe('PURCHASE');
    });

    it('should filter by status', async () => {
      await createTestOrder(user.id, { status: 'PENDING', supplierId: supplier.id });
      await createTestOrder(user.id, { status: 'COMPLETED', supplierId: supplier.id });

      const response = await request(app)
        .get('/orders?status=PENDING')
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(200);
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0].status).toBe('PENDING');
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/orders');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /orders/:id', () => {
    it('should return a single order', async () => {
      const order = await createTestOrder(user.id, { supplierId: supplier.id });

      const response = await request(app)
        .get(`/orders/${order.id}`)
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(200);
      expect(response.body.order.id).toBe(order.id);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/orders/non-existent-id')
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Order not found');
    });
  });

  describe('POST /orders', () => {
    it('should create a new order', async () => {
      const orderData = {
        type: 'PURCHASE',
        supplierId: supplier.id,
        notes: 'Test order',
        items: [
          { productId: product1.id, quantity: 10, unitPrice: 50 },
          { productId: product2.id, quantity: 5, unitPrice: 30 },
        ],
      };

      const response = await request(app)
        .post('/orders')
        .set(createAuthHeader(authToken))
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.order).toBeDefined();
      expect(response.body.order.type).toBe('PURCHASE');
      expect(response.body.order.items).toHaveLength(2);
    });

    it('should calculate total amount correctly', async () => {
      const orderData = {
        type: 'PURCHASE',
        supplierId: supplier.id,
        items: [
          { productId: product1.id, quantity: 10, unitPrice: 50 }, // 500
          { productId: product2.id, quantity: 5, unitPrice: 30 },  // 150
        ],
      };

      const response = await request(app)
        .post('/orders')
        .set(createAuthHeader(authToken))
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.order.totalAmount).toBe(650);
    });

    it('should generate unique order number', async () => {
      const orderData = {
        type: 'PURCHASE',
        supplierId: supplier.id,
        items: [{ productId: product1.id, quantity: 10, unitPrice: 50 }],
      };

      const response1 = await request(app)
        .post('/orders')
        .set(createAuthHeader(authToken))
        .send(orderData);

      const response2 = await request(app)
        .post('/orders')
        .set(createAuthHeader(authToken))
        .send(orderData);

      expect(response1.body.order.orderNumber).not.toBe(response2.body.order.orderNumber);
    });

    it('should require authentication', async () => {
      const response = await request(app).post('/orders').send({});
      expect(response.status).toBe(401);
    });

    it('should set order status to PENDING by default', async () => {
      const orderData = {
        type: 'PURCHASE',
        supplierId: supplier.id,
        items: [{ productId: product1.id, quantity: 10, unitPrice: 50 }],
      };

      const response = await request(app)
        .post('/orders')
        .set(createAuthHeader(authToken))
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.order.status).toBe('PENDING');
    });
  });

  describe('PATCH /orders/:id/status', () => {
    describe('PURCHASE orders', () => {
      it('should increase stock when completing a PURCHASE order', async () => {
        const initialQty1 = product1.quantity;
        const initialQty2 = product2.quantity;

        const order = await createTestOrder(user.id, {
          type: 'PURCHASE',
          status: 'PENDING',
          supplierId: supplier.id,
        });
        await createTestOrderItem(order.id, product1.id, { quantity: 20 });
        await createTestOrderItem(order.id, product2.id, { quantity: 10 });

        const response = await request(app)
          .patch(`/orders/${order.id}/status`)
          .set(createAuthHeader(authToken))
          .send({ status: 'COMPLETED' });

        expect(response.status).toBe(200);

        // Verify stock increased
        const updatedProduct1 = await prisma.product.findUnique({
          where: { id: product1.id },
        });
        const updatedProduct2 = await prisma.product.findUnique({
          where: { id: product2.id },
        });

        expect(updatedProduct1?.quantity).toBe(initialQty1 + 20);
        expect(updatedProduct2?.quantity).toBe(initialQty2 + 10);
      });

      it('should create IN stock movements for PURCHASE order', async () => {
        const order = await createTestOrder(user.id, {
          type: 'PURCHASE',
          status: 'PENDING',
          supplierId: supplier.id,
        });
        await createTestOrderItem(order.id, product1.id, { quantity: 15 });

        await request(app)
          .patch(`/orders/${order.id}/status`)
          .set(createAuthHeader(authToken))
          .send({ status: 'COMPLETED' });

        const movements = await prisma.stockMovement.findMany({
          where: { productId: product1.id },
        });

        expect(movements).toHaveLength(1);
        expect(movements[0].type).toBe('IN');
        expect(movements[0].quantity).toBe(15);
        expect(movements[0].reference).toBe(order.orderNumber);
      });
    });

    describe('SALE orders', () => {
      it('should decrease stock when completing a SALE order', async () => {
        const initialQty = product1.quantity;

        const order = await createTestOrder(user.id, {
          type: 'SALE',
          status: 'PENDING',
          supplierId: supplier.id,
        });
        await createTestOrderItem(order.id, product1.id, { quantity: 25 });

        const response = await request(app)
          .patch(`/orders/${order.id}/status`)
          .set(createAuthHeader(authToken))
          .send({ status: 'COMPLETED' });

        expect(response.status).toBe(200);

        const updatedProduct = await prisma.product.findUnique({
          where: { id: product1.id },
        });

        expect(updatedProduct?.quantity).toBe(initialQty - 25);
      });

      it('should create OUT stock movements for SALE order', async () => {
        const order = await createTestOrder(user.id, {
          type: 'SALE',
          status: 'PENDING',
          supplierId: supplier.id,
        });
        await createTestOrderItem(order.id, product1.id, { quantity: 30 });

        await request(app)
          .patch(`/orders/${order.id}/status`)
          .set(createAuthHeader(authToken))
          .send({ status: 'COMPLETED' });

        const movements = await prisma.stockMovement.findMany({
          where: { productId: product1.id },
        });

        expect(movements).toHaveLength(1);
        expect(movements[0].type).toBe('OUT');
        expect(movements[0].quantity).toBe(30);
      });
    });

    describe('Transaction safety', () => {
      it('should update all items in a single transaction', async () => {
        const order = await createTestOrder(user.id, {
          type: 'PURCHASE',
          status: 'PENDING',
          supplierId: supplier.id,
        });
        await createTestOrderItem(order.id, product1.id, { quantity: 10 });
        await createTestOrderItem(order.id, product2.id, { quantity: 5 });

        await request(app)
          .patch(`/orders/${order.id}/status`)
          .set(createAuthHeader(authToken))
          .send({ status: 'COMPLETED' });

        // Verify all stock movements created
        const movements = await prisma.stockMovement.findMany();
        expect(movements).toHaveLength(2);

        // Verify order status updated
        const updatedOrder = await prisma.order.findUnique({
          where: { id: order.id },
        });
        expect(updatedOrder?.status).toBe('COMPLETED');
      });

      it('should not update stock for non-COMPLETED status changes', async () => {
        const initialQty = product1.quantity;

        const order = await createTestOrder(user.id, {
          type: 'PURCHASE',
          status: 'PENDING',
          supplierId: supplier.id,
        });
        await createTestOrderItem(order.id, product1.id, { quantity: 20 });

        await request(app)
          .patch(`/orders/${order.id}/status`)
          .set(createAuthHeader(authToken))
          .send({ status: 'APPROVED' });

        const updatedProduct = await prisma.product.findUnique({
          where: { id: product1.id },
        });

        expect(updatedProduct?.quantity).toBe(initialQty);
      });

      it('should not update stock if order already COMPLETED', async () => {
        const order = await createTestOrder(user.id, {
          type: 'PURCHASE',
          status: 'COMPLETED',
          supplierId: supplier.id,
        });
        await createTestOrderItem(order.id, product1.id, { quantity: 20 });

        // Try to complete again
        await request(app)
          .patch(`/orders/${order.id}/status`)
          .set(createAuthHeader(authToken))
          .send({ status: 'COMPLETED' });

        // Should only have movements from initial completion
        const movements = await prisma.stockMovement.findMany({
          where: { productId: product1.id },
        });

        // No new movements should be created
        expect(movements).toHaveLength(0);
      });
    });

    describe('Edge cases', () => {
      it('should handle order with no items gracefully', async () => {
        const order = await createTestOrder(user.id, {
          type: 'PURCHASE',
          status: 'PENDING',
          supplierId: supplier.id,
        });

        const response = await request(app)
          .patch(`/orders/${order.id}/status`)
          .set(createAuthHeader(authToken))
          .send({ status: 'COMPLETED' });

        expect(response.status).toBe(200);
      });

      it('should return 404 for non-existent order', async () => {
        const response = await request(app)
          .patch('/orders/non-existent-id/status')
          .set(createAuthHeader(authToken))
          .send({ status: 'COMPLETED' });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Order not found');
      });

      it('should require authentication for completing orders', async () => {
        const order = await createTestOrder(user.id);

        const response = await request(app)
          .patch(`/orders/${order.id}/status`)
          .send({ status: 'COMPLETED' });

        expect(response.status).toBe(401);
      });
    });
  });

  describe('DELETE /orders/:id', () => {
    it('should delete a pending order', async () => {
      const order = await createTestOrder(user.id, {
        status: 'PENDING',
        supplierId: supplier.id,
      });

      const response = await request(app)
        .delete(`/orders/${order.id}`)
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Order deleted successfully');

      const deletedOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(deletedOrder).toBeNull();
    });

    it('should not delete a completed order', async () => {
      const order = await createTestOrder(user.id, {
        status: 'COMPLETED',
        supplierId: supplier.id,
      });

      const response = await request(app)
        .delete(`/orders/${order.id}`)
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot delete completed order');

      const stillExists = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(stillExists).toBeDefined();
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .delete('/orders/non-existent-id')
        .set(createAuthHeader(authToken));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Order not found');
    });

    it('should cascade delete order items', async () => {
      const order = await createTestOrder(user.id, {
        status: 'PENDING',
        supplierId: supplier.id,
      });
      await createTestOrderItem(order.id, product1.id);
      await createTestOrderItem(order.id, product2.id);

      await request(app)
        .delete(`/orders/${order.id}`)
        .set(createAuthHeader(authToken));

      const items = await prisma.orderItem.findMany({
        where: { orderId: order.id },
      });
      expect(items).toHaveLength(0);
    });
  });
});
