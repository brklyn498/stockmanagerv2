import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
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

  if (error.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      error: 'Database error',
      message: error.message,
    })
    return
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  })
}
