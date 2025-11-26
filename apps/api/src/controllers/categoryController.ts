import { Request, Response } from 'express'
import prisma from '../utils/db'

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    res.json({ categories })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
}

export const getCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { products: true },
        },
      },
    })

    if (!category) {
      res.status(404).json({ error: 'Category not found' })
      return
    }

    res.json({ category })
  } catch (error) {
    console.error('Get category error:', error)
    res.status(500).json({ error: 'Failed to fetch category' })
  }
}

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await prisma.category.create({
      data: req.body,
    })

    res.status(201).json({ category })
  } catch (error) {
    console.error('Create category error:', error)
    res.status(500).json({ error: 'Failed to create category' })
  }
}

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const category = await prisma.category.update({
      where: { id },
      data: req.body,
    })

    res.json({ category })
  } catch (error) {
    console.error('Update category error:', error)
    res.status(500).json({ error: 'Failed to update category' })
  }
}

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const productsCount = await prisma.product.count({ where: { categoryId: id } })

    if (productsCount > 0) {
      res.status(400).json({
        error: 'Cannot delete category with associated products',
      })
      return
    }

    await prisma.category.delete({ where: { id } })

    res.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Delete category error:', error)
    res.status(500).json({ error: 'Failed to delete category' })
  }
}
