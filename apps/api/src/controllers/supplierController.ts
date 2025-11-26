import { Request, Response } from 'express'
import prisma from '../utils/db'

export const getSuppliers = async (req: Request, res: Response): Promise<void> => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: { products: true, orders: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    res.json({ suppliers })
  } catch (error) {
    console.error('Get suppliers error:', error)
    res.status(500).json({ error: 'Failed to fetch suppliers' })
  }
}

export const getSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { products: true, orders: true },
        },
      },
    })

    if (!supplier) {
      res.status(404).json({ error: 'Supplier not found' })
      return
    }

    res.json({ supplier })
  } catch (error) {
    console.error('Get supplier error:', error)
    res.status(500).json({ error: 'Failed to fetch supplier' })
  }
}

export const createSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const supplier = await prisma.supplier.create({
      data: req.body,
    })

    res.status(201).json({ supplier })
  } catch (error) {
    console.error('Create supplier error:', error)
    res.status(500).json({ error: 'Failed to create supplier' })
  }
}

export const updateSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const supplier = await prisma.supplier.update({
      where: { id },
      data: req.body,
    })

    res.json({ supplier })
  } catch (error) {
    console.error('Update supplier error:', error)
    res.status(500).json({ error: 'Failed to update supplier' })
  }
}

export const deleteSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    await prisma.supplier.delete({ where: { id } })

    res.json({ message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('Delete supplier error:', error)
    res.status(500).json({ error: 'Failed to delete supplier' })
  }
}
