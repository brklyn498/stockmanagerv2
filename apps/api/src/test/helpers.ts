import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { hashPassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

export const prisma = new PrismaClient();

/**
 * Clear all data from the test database
 */
export async function clearDatabase() {
  const tables = [
    'stockMovement',
    'orderItem',
    'order',
    'product',
    'category',
    'supplier',
    'user',
    'setting',
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
  }
}

/**
 * Create a test user
 */
export async function createTestUser(overrides: any = {}) {
  const hashedPassword = await hashPassword('password123');

  return prisma.user.create({
    data: {
      email: overrides.email || faker.internet.email(),
      password: hashedPassword,
      name: overrides.name || faker.person.fullName(),
      role: overrides.role || 'USER',
      ...overrides,
    },
  });
}

/**
 * Create a test admin user
 */
export async function createTestAdmin(overrides: any = {}) {
  return createTestUser({ role: 'ADMIN', ...overrides });
}

/**
 * Create a test category
 */
export async function createTestCategory(overrides: any = {}) {
  return prisma.category.create({
    data: {
      name: overrides.name || faker.commerce.department(),
      description: overrides.description || faker.commerce.productDescription(),
      ...overrides,
    },
  });
}

/**
 * Create a test supplier
 */
export async function createTestSupplier(overrides: any = {}) {
  return prisma.supplier.create({
    data: {
      name: overrides.name || faker.company.name(),
      email: overrides.email || faker.internet.email(),
      phone: overrides.phone || faker.phone.number(),
      address: overrides.address || faker.location.streetAddress(),
      ...overrides,
    },
  });
}

/**
 * Create a test product
 */
export async function createTestProduct(overrides: any = {}) {
  let categoryId = overrides.categoryId;
  let supplierId = overrides.supplierId;

  // Create category and supplier if not provided
  if (!categoryId) {
    const category = await createTestCategory();
    categoryId = category.id;
  }

  if (!supplierId) {
    const supplier = await createTestSupplier();
    supplierId = supplier.id;
  }

  return prisma.product.create({
    data: {
      name: overrides.name || faker.commerce.productName(),
      description: overrides.description || faker.commerce.productDescription(),
      sku: overrides.sku || `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
      barcode: overrides.barcode || faker.string.numeric(13),
      quantity: overrides.quantity ?? faker.number.int({ min: 0, max: 100 }),
      minStock: overrides.minStock ?? 10,
      price: overrides.price ?? parseFloat(faker.commerce.price()),
      costPrice: overrides.costPrice ?? parseFloat(faker.commerce.price({ min: 10, max: 50 })),
      categoryId,
      supplierId,
      isActive: overrides.isActive ?? true,
      unit: overrides.unit || 'piece',
      ...overrides,
    },
  });
}

/**
 * Create a test order
 */
export async function createTestOrder(userId: string, overrides: any = {}) {
  return prisma.order.create({
    data: {
      orderNumber: overrides.orderNumber || `ORD-${faker.string.alphanumeric(8).toUpperCase()}`,
      type: overrides.type || 'PURCHASE',
      status: overrides.status || 'PENDING',
      totalAmount: overrides.totalAmount ?? 0,
      notes: overrides.notes || null,
      userId,
      ...overrides,
    },
  });
}

/**
 * Create a test order item
 */
export async function createTestOrderItem(orderId: string, productId: string, overrides: any = {}) {
  return prisma.orderItem.create({
    data: {
      orderId,
      productId,
      quantity: overrides.quantity ?? faker.number.int({ min: 1, max: 10 }),
      unitPrice: overrides.unitPrice ?? parseFloat(faker.commerce.price()),
      ...overrides,
    },
  });
}

/**
 * Create a test stock movement
 */
export async function createTestStockMovement(
  productId: string,
  userId: string,
  overrides: any = {}
) {
  return prisma.stockMovement.create({
    data: {
      productId,
      userId,
      type: overrides.type || 'IN',
      quantity: overrides.quantity ?? faker.number.int({ min: 1, max: 50 }),
      reason: overrides.reason || null,
      reference: overrides.reference || null,
      ...overrides,
    },
  });
}

/**
 * Generate an auth token for testing
 */
export function generateTestToken(user: any) {
  return generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
}

/**
 * Create authorization header
 */
export function createAuthHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
