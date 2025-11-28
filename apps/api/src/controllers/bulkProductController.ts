import { Request, Response } from 'express'
import prisma from '../utils/db'

// Bulk update category
export const bulkUpdateCategory = async (req: Request, res: Response) => {
    try {
        const { productIds, categoryId } = req.body

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ error: 'productIds array is required' })
        }

        if (!categoryId) {
            return res.status(400).json({ error: 'categoryId is required' })
        }

        // Verify category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        })

        if (!category) {
            return res.status(404).json({ error: 'Category not found' })
        }

        // Update all products
        const result = await prisma.product.updateMany({
            where: { id: { in: productIds } },
            data: { categoryId },
        })

        res.json({
            message: `Updated ${result.count} products`,
            count: result.count,
        })
    } catch (error: any) {
        console.error('Bulk update category error:', error)
        res.status(500).json({ error: error.message || 'Failed to bulk update category' })
    }
}

// Bulk update supplier
export const bulkUpdateSupplier = async (req: Request, res: Response) => {
    try {
        const { productIds, supplierId } = req.body

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ error: 'productIds array is required' })
        }

        // supplierId can be null to remove supplier
        if (supplierId !== null && supplierId !== undefined) {
            const supplier = await prisma.supplier.findUnique({
                where: { id: supplierId },
            })

            if (!supplier) {
                return res.status(404).json({ error: 'Supplier not found' })
            }
        }

        const result = await prisma.product.updateMany({
            where: { id: { in: productIds } },
            data: { supplierId: supplierId || null },
        })

        res.json({
            message: `Updated ${result.count} products`,
            count: result.count,
        })
    } catch (error: any) {
        console.error('Bulk update supplier error:', error)
        res.status(500).json({ error: error.message || 'Failed to bulk update supplier' })
    }
}

// Bulk adjust prices
export const bulkAdjustPrices = async (req: Request, res: Response) => {
    try {
        const { productIds, adjustmentType, value, applyTo } = req.body
        // adjustmentType: 'increase' | 'decrease'
        // value: number (percentage if %, fixed amount otherwise)
        // applyTo: 'price' | 'costPrice' | 'both'

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ error: 'productIds array is required' })
        }

        if (!adjustmentType || !['increase', 'decrease'].includes(adjustmentType)) {
            return res.status(400).json({ error: 'adjustmentType must be increase or decrease' })
        }

        if (value === undefined || value <= 0) {
            return res.status(400).json({ error: 'value must be greater than 0' })
        }

        if (!applyTo || !['price', 'costPrice', 'both'].includes(applyTo)) {
            return res.status(400).json({ error: 'applyTo must be price, costPrice, or both' })
        }

        // Get all products to calculate new prices
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, price: true, costPrice: true },
        })

        // Calculate multiplier
        const multiplier = adjustmentType === 'increase' ? (1 + value / 100) : (1 - value / 100)

        // Update each product individually to calculate percentage
        const updates = products.map((product: { id: string; price: number; costPrice: number }) => {
            const data: any = {}

            if (applyTo === 'price' || applyTo === 'both') {
                data.price = Math.round(product.price * multiplier * 100) / 100
            }

            if (applyTo === 'costPrice' || applyTo === 'both') {
                data.costPrice = Math.round(product.costPrice * multiplier * 100) / 100
            }

            return prisma.product.update({
                where: { id: product.id },
                data,
            })
        })

        await Promise.all(updates)

        res.json({
            message: `Adjusted prices for ${products.length} products`,
            count: products.length,
        })
    } catch (error: any) {
        console.error('Bulk adjust prices error:', error)
        res.status(500).json({ error: error.message || 'Failed to bulk adjust prices' })
    }
}

// Bulk adjust stock
export const bulkAdjustStock = async (req: Request, res: Response) => {
    try {
        const { productIds, adjustmentType, value, userId } = req.body
        // adjustmentType: 'add' | 'subtract' | 'set'
        // value: number

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ error: 'productIds array is required' })
        }

        if (!adjustmentType || !['add', 'subtract', 'set'].includes(adjustmentType)) {
            return res.status(400).json({ error: 'adjustmentType must be add, subtract, or set' })
        }

        if (value === undefined || value < 0) {
            return res.status(400).json({ error: 'value must be >= 0' })
        }

        // Get current user from auth (for now use a default user ID)
        const defaultUserId = userId || 'system'

        // Get all products to calculate new quantities
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, quantity: true, name: true },
        })

        // Update each product and create stock movement records
        const updates = products.map(async (product: { id: string; quantity: number; name: string }) => {
            let newQuantity: number

            switch (adjustmentType) {
                case 'add':
                    newQuantity = product.quantity + value
                    break
                case 'subtract':
                    newQuantity = Math.max(0, product.quantity - value)
                    break
                case 'set':
                    newQuantity = value
                    break
                default:
                    newQuantity = product.quantity
            }

            const quantityChange = newQuantity - product.quantity

            // Update product quantity
            await prisma.product.update({
                where: { id: product.id },
                data: { quantity: newQuantity },
            })

            // Create stock movement record
            if (quantityChange !== 0) {
                await prisma.stockMovement.create({
                    data: {
                        productId: product.id,
                        userId: defaultUserId,
                        type: quantityChange > 0 ? 'IN' : 'OUT',
                        quantity: Math.abs(quantityChange),
                        reason: `Bulk adjustment: ${adjustmentType} ${value}`,
                    },
                })
            }
        })

        await Promise.all(updates)

        res.json({
            message: `Adjusted stock for ${products.length} products`,
            count: products.length,
        })
    } catch (error: any) {
        console.error('Bulk adjust stock error:', error)
        res.status(500).json({ error: error.message || 'Failed to bulk adjust stock' })
    }
}

// Bulk update status (activate/deactivate)
export const bulkUpdateStatus = async (req: Request, res: Response) => {
    try {
        const { productIds, isActive } = req.body

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ error: 'productIds array is required' })
        }

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: 'isActive must be a boolean' })
        }

        const result = await prisma.product.updateMany({
            where: { id: { in: productIds } },
            data: { isActive },
        })

        res.json({
            message: `${isActive ? 'Activated' : 'Deactivated'} ${result.count} products`,
            count: result.count,
        })
    } catch (error: any) {
        console.error('Bulk update status error:', error)
        res.status(500).json({ error: error.message || 'Failed to bulk update status' })
    }
}

// Bulk delete products
// Bulk delete products (Soft delete)
export const bulkDeleteProducts = async (req: Request, res: Response) => {
    try {
        const { productIds } = req.body

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ error: 'productIds array is required' })
        }

        // Soft delete products (set isActive to false)
        const result = await prisma.product.updateMany({
            where: { id: { in: productIds } },
            data: { isActive: false },
        })

        res.json({
            message: `Deleted ${result.count} products`,
            count: result.count,
        })
    } catch (error: any) {
        console.error('Bulk delete products error:', error)
        res.status(500).json({ error: error.message || 'Failed to bulk delete products' })
    }
}
