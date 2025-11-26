import { Response } from 'express'
import prisma from '../utils/db'
import { AuthRequest } from '../middleware/auth'

export const getStockMovements = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { productId, type, startDate, endDate } = req.query

    const where: any = {}

    if (productId) {
      where.productId = productId
    }

    if (type) {
      where.type = type
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate as string)
      if (endDate) where.createdAt.lte = new Date(endDate as string)
    }

    const movements = await prisma.stockMovement.findMany({
      where,
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
      take: 100,
    })

    res.json({ movements })
  } catch (error) {
    console.error('Get stock movements error:', error)
    res.status(500).json({ error: 'Failed to fetch stock movements' })
  }
}

export const createStockMovement = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const { type, quantity, reason, reference, productId } = req.body

    // Update product quantity
    const product = await prisma.product.findUnique({ where: { id: productId } })

    if (!product) {
      res.status(404).json({ error: 'Product not found' })
      return
    }

    let newQuantity = product.quantity

    switch (type) {
      case 'IN':
      case 'RETURN':
        newQuantity += quantity
        break
      case 'OUT':
      case 'DAMAGED':
        newQuantity -= quantity
        break
      case 'ADJUSTMENT':
        newQuantity = quantity
        break
    }

    if (newQuantity < 0) {
      res.status(400).json({ error: 'Insufficient stock' })
      return
    }

    const [movement] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          type,
          quantity,
          reason,
          reference,
          productId,
          userId: req.user.userId,
        },
        include: {
          product: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { quantity: newQuantity },
      }),
    ])

    res.status(201).json({ movement })
  } catch (error) {
    console.error('Create stock movement error:', error)
    res.status(500).json({ error: 'Failed to create stock movement' })
  }
}
