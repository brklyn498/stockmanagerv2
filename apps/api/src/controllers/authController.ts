import { Request, Response } from 'express'
import prisma from '../utils/db'
import { hashPassword, comparePassword } from '../utils/password'
import { generateToken, generateRefreshToken } from '../utils/jwt'
import { AuthRequest } from '../middleware/auth'

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role = 'STAFF' } = req.body

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' })
      return
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    res.status(201).json({ user, token, refreshToken })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Failed to register user' })
  }
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    console.log(`[AUTH] Login attempt for: ${email}`)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      console.log(`[AUTH] User not found: ${email}`)
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    console.log(`[AUTH] Comparing password for: ${email}`)
    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      console.log(`[AUTH] Invalid password for: ${email}`)
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    console.log(`[AUTH] Generating tokens for: ${email}`)
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    console.log(`[AUTH] Login successful for: ${email}`)
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      refreshToken,
    })
  } catch (error) {
    console.error('[AUTH] Login error:', error)
    res.status(500).json({ error: 'Failed to login' })
  }
}

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({ user })
  } catch (error) {
    console.error('Me error:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
}

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' })
      return
    }

    const { verifyToken } = await import('../utils/jwt')
    const decoded = verifyToken(refreshToken)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    res.json({ token, refreshToken: newRefreshToken })
  } catch (error) {
    console.error('Refresh error:', error)
    res.status(401).json({ error: 'Invalid refresh token' })
  }
}
