import { Request, Response } from 'express'
import prisma from '../utils/db'

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '50',
      search = '',
      categoryId,
      lowStock,
      // New filters
      categories,      // Comma-separated category IDs
      suppliers,       // Comma-separated supplier IDs
      stockStatus,     // 'low' | 'normal' | 'overstocked' | 'out' | 'all'
      priceMin,
      priceMax,
      isActive,        // 'true' | 'false' | undefined (all)
      dateFrom,
      dateTo,
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const where: any = {}

    // Active status filter
    if (isActive !== undefined) {
      where.isActive = isActive === 'true'
    } else {
      // Default to showing only active products if not specified
      where.isActive = true
    }

    // Legacy single category filter (for backward compatibility)
    if (categoryId) {
      where.categoryId = categoryId
    }

    // Multi-category filter (overrides single category)
    if (categories && typeof categories === 'string') {
      const categoryIds = categories.split(',').filter(id => id.trim())
      if (categoryIds.length > 0) {
        where.categoryId = { in: categoryIds }
      }
    }

    // Multi-supplier filter
    if (suppliers && typeof suppliers === 'string') {
      const supplierIds = suppliers.split(',').filter(id => id.trim())
      if (supplierIds.length > 0) {
        where.supplierId = { in: supplierIds }
      }
    }

    // Price range filter
    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {}
      if (priceMin !== undefined) {
        where.price.gte = parseFloat(priceMin as string)
      }
      if (priceMax !== undefined) {
        where.price.lte = parseFloat(priceMax as string)
      }
    }

    // Date range filter
    if (dateFrom !== undefined || dateTo !== undefined) {
      where.createdAt = {}
      if (dateFrom !== undefined) {
        where.createdAt.gte = new Date(dateFrom as string)
      }
      if (dateTo !== undefined) {
        where.createdAt.lte = new Date(dateTo as string)
      }
    }

    // No search filter in the where clause - we'll filter client-side for case-insensitive
    const hasSearch = search && typeof search === 'string' && search.trim() !== ''

    // Legacy low stock filter (for backward compatibility)
    if (lowStock === 'true') {
      where.quantity = { lte: prisma.product.fields.minStock }
    }

    // For case-insensitive search in SQLite, fetch all and filter in-memory
    let products, total

    // Fetch all products with where clause
    const allProducts = await prisma.product.findMany({
      where,
      include: {
        category: true,
        supplier: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter by search term (case-insensitive)
    let filtered = allProducts
    if (hasSearch) {
      const searchLower = (search as string).toLowerCase()
      filtered = allProducts.filter((p) => {
        const nameMatch = p.name?.toLowerCase().includes(searchLower)
        const skuMatch = p.sku?.toLowerCase().includes(searchLower)
        const barcodeMatch = p.barcode?.toLowerCase().includes(searchLower)
        const descMatch = p.description?.toLowerCase().includes(searchLower)
        return nameMatch || skuMatch || barcodeMatch || descMatch
      })
    }

    // Filter by stock status
    if (stockStatus && stockStatus !== 'all') {
      filtered = filtered.filter((p) => {
        switch (stockStatus) {
          case 'out':
            return p.quantity === 0
          case 'low':
            return p.quantity > 0 && p.quantity <= p.minStock
          case 'normal':
            return p.quantity > p.minStock && (p.maxStock === null || p.quantity <= p.maxStock)
          case 'overstocked':
            return p.maxStock !== null && p.quantity > p.maxStock
          default:
            return true
        }
      })
    }

    // Apply pagination
    total = filtered.length
    products = filtered.slice(skip, skip + limitNum)

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
}

export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        images: { orderBy: { sortOrder: 'asc' } },
        stockMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true } } },
        },
      },
    })

    if (!product) {
      res.status(404).json({ error: 'Product not found' })
      return
    }

    res.json({ product })
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
}

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.create({
      data: req.body,
      include: {
        category: true,
        supplier: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    })

    res.status(201).json({ product })
  } catch (error: any) {
    console.error('Create product error:', error)

    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field'
      res.status(400).json({
        error: `A product with this ${field} already exists. Please use a different ${field}.`
      })
      return
    }

    res.status(500).json({ error: 'Failed to create product' })
  }
}

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const product = await prisma.product.update({
      where: { id },
      data: req.body,
      include: {
        category: true,
        supplier: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    })

    res.json({ product })
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ error: 'Failed to update product' })
  }
}

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    })

    res.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ error: 'Failed to delete product' })
  }
}

export const getLowStockProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        quantity: { lte: prisma.product.fields.minStock },
      },
      include: {
        category: true,
        supplier: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { quantity: 'asc' },
    })

    res.json({ products })
  } catch (error) {
    console.error('Get low stock products error:', error)
    res.status(500).json({ error: 'Failed to fetch low stock products' })
  }
}

export const getProductAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      res.status(404).json({ error: 'Product not found' })
      return
    }

    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    // Fetch only necessary fields for stock movements
    const movements = await prisma.stockMovement.findMany({
      where: {
        productId: id,
        createdAt: { gte: twelveMonthsAgo },
      },
      select: {
        type: true,
        quantity: true,
        createdAt: true,
      },
    })

    // 1. Movement Frequency (by month) - Aggregated in JS to avoid complex SQL for now
    const movementFrequency = Array.from({ length: 12 }).map((_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' })

      const movementsInMonth = movements.filter(m => {
        const mDate = new Date(m.createdAt)
        return mDate.getMonth() === date.getMonth() && mDate.getFullYear() === date.getFullYear()
      })

      const inQty = movementsInMonth
        .filter(m => ['IN', 'RETURN'].includes(m.type))
        .reduce((sum, m) => sum + m.quantity, 0)

      const outQty = movementsInMonth
        .filter(m => ['OUT', 'DAMAGED'].includes(m.type))
        .reduce((sum, m) => sum + m.quantity, 0)

      return {
        name: monthKey,
        in: inQty,
        out: outQty
      }
    }).reverse()

    // 2. Turnover Rate & Total Sold
    // Optimize: Aggregate directly in DB
    const totalSoldResult = await prisma.orderItem.aggregate({
      where: {
        productId: id,
        order: {
          type: 'SALE',
          status: 'COMPLETED',
        },
      },
      _sum: {
        quantity: true,
      },
    })
    const totalSold = totalSoldResult._sum.quantity || 0

    const turnoverRate = product.quantity > 0
      ? (totalSold / product.quantity).toFixed(2)
      : 'N/A'

    // 3. Average Daily Sales (Last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const salesLast30DaysResult = await prisma.orderItem.aggregate({
      where: {
        productId: id,
        order: {
          type: 'SALE',
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo },
        },
      },
      _sum: {
        quantity: true,
      },
    })

    const salesLast30Days = salesLast30DaysResult._sum.quantity || 0
    const avgDailySales = (salesLast30Days / 30).toFixed(1)

    // 4. Days of Stock
    const daysOfStock = parseFloat(avgDailySales) > 0
      ? Math.round(product.quantity / parseFloat(avgDailySales))
      : '∞'

    res.json({
      analytics: {
        movementFrequency,
        turnoverRate,
        avgDailySales,
        daysOfStock,
        totalSold
      }
    })
  } catch (error) {
    console.error('Get product analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch product analytics' })
  }
}
