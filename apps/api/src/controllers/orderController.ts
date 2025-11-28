import { Response } from 'express'
import prisma from '../utils/db'
import { AuthRequest } from '../middleware/auth'

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, status, search, productId } = req.query

    const where: any = {}

    if (type) where.type = type
    if (status) where.status = status
    if (productId) {
      where.items = {
        some: {
          productId: productId as string,
        },
      }
    }

    // Add search functionality
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string } },
        { notes: { contains: search as string } },
        { supplier: { name: { contains: search as string } } },
      ]
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        supplier: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    res.json({ orders })
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
}

export const getOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        supplier: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    res.json({ order })
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({ error: 'Failed to fetch order' })
  }
}

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Demo mode: Get or create a demo user if no user is authenticated
    let userId = req.user?.userId

    if (!userId) {
      // Find or create demo user for orders
      let demoUser = await prisma.user.findFirst({
        where: { email: 'admin@stockmanager.com' }
      })

      if (!demoUser) {
        // Create demo user if doesn't exist
        demoUser = await prisma.user.create({
          data: {
            name: 'Admin User',
            email: 'admin@stockmanager.com',
            password: 'demo', // Not used in demo mode
          }
        })
      }

      userId = demoUser.id
    }

    const { type, supplierId, notes, items } = req.body

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unitPrice,
      0
    )

    // Generate order number
    const orderCount = await prisma.order.count()
    const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`

    const order = await prisma.order.create({
      data: {
        orderNumber,
        type,
        supplierId,
        notes,
        totalAmount,
        userId,
        items: {
          create: items,
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    res.status(201).json({ order })
  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({ error: 'Failed to create order' })
  }
}

export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const { status } = req.body

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    // If order is completed, update stock
    if (status === 'COMPLETED' && order.status !== 'COMPLETED') {
      // Demo mode: Get or create demo user
      let userId = req.user?.userId

      if (!userId) {
        let demoUser = await prisma.user.findFirst({
          where: { email: 'admin@stockmanager.com' }
        })

        if (!demoUser) {
          demoUser = await prisma.user.create({
            data: {
              name: 'Admin User',
              email: 'admin@stockmanager.com',
              password: 'demo',
            }
          })
        }

        userId = demoUser.id
      }

      await prisma.$transaction(async tx => {
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          })

          if (!product) continue

          const quantityChange =
            order.type === 'PURCHASE' ? item.quantity : -item.quantity

          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: product.quantity + quantityChange,
            },
          })

          await tx.stockMovement.create({
            data: {
              type: order.type === 'PURCHASE' ? 'IN' : 'OUT',
              quantity: item.quantity,
              reason: `Order ${order.orderNumber}`,
              reference: order.orderNumber,
              productId: item.productId,
              userId,
            },
          })
        }

        await tx.order.update({
          where: { id },
          data: { status },
        })
      })
    } else {
      await prisma.order.update({
        where: { id },
        data: { status },
      })
    }

    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    res.json({ order: updatedOrder })
  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json({ error: 'Failed to update order status' })
  }
}

export const deleteOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const order = await prisma.order.findUnique({ where: { id } })

    if (!order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    if (order.status === 'COMPLETED') {
      res.status(400).json({ error: 'Cannot delete completed order' })
      return
    }

    await prisma.order.delete({ where: { id } })

    res.json({ message: 'Order deleted successfully' })
  } catch (error) {
    console.error('Delete order error:', error)
    res.status(500).json({ error: 'Failed to delete order' })
  }
}
