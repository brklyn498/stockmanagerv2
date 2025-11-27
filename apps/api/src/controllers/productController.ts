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
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const where: any = {
      isActive: true,
    }

    // No search filter in the where clause - we'll filter client-side for case-insensitive
    const hasSearch = search && typeof search === 'string' && search.trim() !== ''

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (lowStock === 'true') {
      where.quantity = { lte: prisma.product.fields.minStock }
    }

    // For case-insensitive search in SQLite, fetch all and filter in-memory
    let products, total

    if (hasSearch) {
      const searchLower = (search as string).toLowerCase()

      // Fetch all matching products (without search in where clause)
      const allProducts = await prisma.product.findMany({
        where,
        include: {
          category: true,
          supplier: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      // Filter client-side for case-insensitive search
      const filtered = allProducts.filter((p) => {
        const nameMatch = p.name?.toLowerCase().includes(searchLower)
        const skuMatch = p.sku?.toLowerCase().includes(searchLower)
        const barcodeMatch = p.barcode?.toLowerCase().includes(searchLower)
        const descMatch = p.description?.toLowerCase().includes(searchLower)
        return nameMatch || skuMatch || barcodeMatch || descMatch
      })

      // Apply pagination
      total = filtered.length
      products = filtered.slice(skip, skip + limitNum)
    } else {
      // No search - use normal Prisma query with pagination
      ;[products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            supplier: true,
          },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({ where }),
      ])
    }

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
      },
      orderBy: { quantity: 'asc' },
    })

    res.json({ products })
  } catch (error) {
    console.error('Get low stock products error:', error)
    res.status(500).json({ error: 'Failed to fetch low stock products' })
  }
}
