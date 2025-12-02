import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes'
import productRoutes from './routes/productRoutes'
import categoryRoutes from './routes/categoryRoutes'
import supplierRoutes from './routes/supplierRoutes'
import clientRoutes from './routes/clientRoutes'
import stockMovementRoutes from './routes/stockMovementRoutes'
import orderRoutes from './routes/orderRoutes'
import dashboardRoutes from './routes/dashboardRoutes'
import imageRoutes from './routes/imageRoutes'
import reportRoutes from './routes/reportRoutes'
import { errorHandler } from './middleware/errorHandler'
import path from 'path'
import { setupSwagger } from './swagger'
import { connectDatabase, disconnectDatabase } from './utils/db'
import { prepareDatabase } from './utils/cleanup'
import prisma from './utils/db'
import { initializeBot } from './bot'

dotenv.config()

const app = express()
const PORT = process.env.API_PORT || 3001

// Set timeout for all requests (30 seconds)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  req.setTimeout(30000)
  res.setTimeout(30000)
  next()
})

app.use(cors())
app.use(express.json())

// Serve static files for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Setup Swagger documentation
setupSwagger(app)

// Root route
app.get('/', (_req, res) => {
  res.json({
    message: 'Stock Manager API v2',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      suppliers: '/api/suppliers',
      clients: '/api/clients',
      orders: '/api/orders',
      stockMovements: '/api/stock-movements',
      dashboard: '/api/dashboard',
      reports: '/api/reports',
      docs: '/api-docs'
    }
  })
})

// Health check with database connectivity
app.get('/api/health', async (_req, res) => {
  console.log('[HEALTH] Health check requested')

  try {
    // Ping database to verify connection
    await prisma.$queryRaw`SELECT 1`
    res.json({
      status: 'ok',
      message: 'Stock Manager API v2',
      database: 'connected'
    })
  } catch (error) {
    console.error('[HEALTH] Database connection failed:', error)
    res.status(503).json({
      status: 'degraded',
      message: 'Stock Manager API v2',
      database: 'disconnected',
      error: 'Database unavailable'
    })
  }
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/stock-movements', stockMovementRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/images', imageRoutes)
app.use('/api/reports', reportRoutes)

// Error handling middleware (must be last)
app.use(errorHandler)

// Graceful shutdown handler setup
const setupShutdownHandlers = (server: any) => {
  process.on('SIGTERM', async () => {
    console.log('📡 SIGTERM signal received: closing HTTP server gracefully')
    server.close(async () => {
      console.log('✅ HTTP server closed')
      await disconnectDatabase()
      process.exit(0)
    })
  })

  process.on('SIGINT', async () => {
    console.log('📡 SIGINT signal received: closing HTTP server gracefully')
    server.close(async () => {
      console.log('✅ HTTP server closed')
      await disconnectDatabase()
      process.exit(0)
    })
  })
}

// Initialize database and start server
const startServer = async () => {
  try {
    // Prepare database (cleanup journal files, etc.)
    prepareDatabase()

    // Connect to database
    await connectDatabase()

    // Initialize Telegram bot
    initializeBot()

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 API server running on http://localhost:${PORT}`)
      console.log(`📊 API Documentation: http://localhost:${PORT}/api-docs`)
    })

    // Set server timeout to 30 seconds
    server.timeout = 30000
    server.keepAliveTimeout = 61000
    server.headersTimeout = 62000

    // Setup graceful shutdown handlers
    setupShutdownHandlers(server)
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()

// ============================================================================
// CRASH-PROOFING: Global Error Handlers
// ============================================================================
// These handlers prevent the Node.js process from exiting when errors occur,
// keeping the API server alive even when unexpected errors happen.

process.on('uncaughtException', (error: Error) => {
  console.error('❌ [UNCAUGHT EXCEPTION] Critical error occurred, but server will stay alive:')
  console.error('Error name:', error.name)
  console.error('Error message:', error.message)
  console.error('Stack trace:', error.stack)
  console.error('Timestamp:', new Date().toISOString())
  console.error('⚠️  Server is still running despite this error')
  // DO NOT exit: process.exit(1)
})

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('❌ [UNHANDLED REJECTION] Promise rejection occurred, but server will stay alive:')
  console.error('Reason:', reason)
  console.error('Promise:', promise)
  console.error('Timestamp:', new Date().toISOString())
  console.error('⚠️  Server is still running despite this rejection')
  // DO NOT exit: process.exit(1)
})

console.log('🛡️  Global error handlers installed - server is crash-proof')
