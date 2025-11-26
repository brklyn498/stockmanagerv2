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

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { sku: { contains: search as string } },
        { barcode: { contains: search as string } },
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (lowStock === 'true') {
      where.quantity = { lte: prisma.product.fields.minStock }
    }

    const [products, total] = await Promise.all([
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
  } catch (error) {
    console.error('Create product error:', error)
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
