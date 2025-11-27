import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  console.error('Error:', error)

  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    })
    return
  }

  // Handle Prisma Client errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any

    // P2002: Unique constraint violation
    if (prismaError.code === 'P2002') {
      const field = prismaError.meta?.target?.[0] || 'field'
      return res.status(409).json({
        error: `A record with this ${field} already exists`,
        code: prismaError.code,
      })
    }

    // P2025: Record not found
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        error: 'Record not found',
        code: prismaError.code,
      })
    }

    // P1001: Can't reach database server
    if (prismaError.code === 'P1001') {
      return res.status(503).json({
        error: 'Database connection failed - server unavailable',
        code: prismaError.code,
      })
    }

    // P1002: Database server timeout
    if (prismaError.code === 'P1002') {
      return res.status(504).json({
        error: 'Database operation timed out',
        code: prismaError.code,
      })
    }

    // Other Prisma errors
    return res.status(400).json({
      error: 'Database operation failed',
      code: prismaError.code,
      details: prismaError.message,
    })
  }

  // Handle Prisma initialization errors
  if (error.name === 'PrismaClientInitializationError') {
    console.error('❌ [ERROR HANDLER] Prisma initialization error:', error)
    return res.status(503).json({
      error: 'Database initialization failed - service temporarily unavailable',
      details: 'The database connection could not be established',
    })
  }

  // Handle Prisma rust panic errors
  if (error.name === 'PrismaClientRustPanicError') {
    console.error('❌ [ERROR HANDLER] Prisma panic error:', error)
    return res.status(500).json({
      error: 'Database engine error - please contact support',
    })
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  })
}
