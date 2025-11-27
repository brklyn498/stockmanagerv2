import { Request, Response } from 'express'
import prisma from '../utils/db'

export const getClients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query

    const clients = await prisma.client.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search as string } },
              { email: { contains: search as string } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
    })

    res.json({ clients })
  } catch (error) {
    console.error('Get clients error:', error)
    res.status(500).json({ error: 'Failed to fetch clients' })
  }
}

export const getClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const client = await prisma.client.findUnique({
      where: { id },
    })

    if (!client) {
      res.status(404).json({ error: 'Client not found' })
      return
    }

    res.json({ client })
  } catch (error) {
    console.error('Get client error:', error)
    res.status(500).json({ error: 'Failed to fetch client' })
  }
}

export const createClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const client = await prisma.client.create({
      data: req.body,
    })

    res.status(201).json({ client })
  } catch (error) {
    console.error('Create client error:', error)
    res.status(500).json({ error: 'Failed to create client' })
  }
}

export const updateClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const client = await prisma.client.update({
      where: { id },
      data: req.body,
    })

    res.json({ client })
  } catch (error) {
    console.error('Update client error:', error)
    res.status(500).json({ error: 'Failed to update client' })
  }
}

export const deleteClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    await prisma.client.delete({ where: { id } })

    res.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Delete client error:', error)
    res.status(500).json({ error: 'Failed to delete client' })
  }
}
