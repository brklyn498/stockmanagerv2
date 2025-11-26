import { Request, Response } from 'express'
import prisma from '../utils/db'

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalProducts,
      lowStockCount,
      pendingOrdersCount,
      todayMovementsCount,
      totalStockValue,
      categoryDistribution,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),

      prisma.product.count({
        where: {
          isActive: true,
          quantity: { lte: prisma.product.fields.minStock },
        },
      }),

      prisma.order.count({ where: { status: 'PENDING' } }),

      prisma.stockMovement.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      prisma.product.aggregate({
        where: { isActive: true },
        _sum: {
          quantity: true,
        },
      }),

      prisma.category.findMany({
        select: {
          name: true,
          _count: {
            select: { products: true },
          },
        },
      }),
    ])

    res.json({
      stats: {
        totalProducts,
        lowStockCount,
        pendingOrdersCount,
        todayMovementsCount,
        totalStockValue: totalStockValue._sum.quantity || 0,
      },
      categoryDistribution: categoryDistribution.map(cat => ({
        name: cat.name,
        count: cat._count.products,
      })),
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
}

export const getLowStockAlerts = async (
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
      },
      orderBy: { quantity: 'asc' },
      take: 20,
    })

    res.json({ products })
  } catch (error) {
    console.error('Get low stock alerts error:', error)
    res.status(500).json({ error: 'Failed to fetch low stock alerts' })
  }
}

export const getRecentMovements = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    res.json({ movements })
  } catch (error) {
    console.error('Get recent movements error:', error)
    res.status(500).json({ error: 'Failed to fetch recent movements' })
  }
}
