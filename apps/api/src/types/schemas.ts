import { z } from 'zod'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']).optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// Product schemas
export const createProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  barcode: z.string().optional(),
  price: z.number().positive(),
  costPrice: z.number().positive(),
  quantity: z.number().int().nonnegative().default(0),
  minStock: z.number().int().nonnegative().default(10),
  maxStock: z.number().int().positive().optional(),
  unit: z.string().default('piece'),
  categoryId: z.string(),
  supplierId: z.string().optional(),
})

export const updateProductSchema = createProductSchema.partial()

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export const updateCategorySchema = createCategorySchema.partial()

// Supplier schemas
export const createSupplierSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const updateSupplierSchema = createSupplierSchema.partial()

// Client schemas
export const createClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export const updateClientSchema = createClientSchema.partial()

// Stock Movement schemas
export const createStockMovementSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'DAMAGED']),
  quantity: z.number().int(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  productId: z.string(),
})

// Order schemas
export const createOrderSchema = z.object({
  type: z.enum(['PURCHASE', 'SALE']),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })
  ),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'CANCELLED']),
})
