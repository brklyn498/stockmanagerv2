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
import { errorHandler } from './middleware/errorHandler'
import { setupSwagger } from './swagger'

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
      docs: '/api-docs'
    }
  })
})

// Health check
app.get('/api/health', (_req, res) => {
  console.log('[HEALTH] Health check requested')
  res.json({ status: 'ok', message: 'Stock Manager API v2' })
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

// Error handling middleware (must be last)
app.use(errorHandler)

const server = app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`)
})

// Set server timeout to 30 seconds
server.timeout = 30000
server.keepAliveTimeout = 61000
server.headersTimeout = 62000

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

process.on('SIGTERM', () => {
  console.log('📡 SIGTERM signal received: closing HTTP server gracefully')
  server.close(() => {
    console.log('✅ HTTP server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('📡 SIGINT signal received: closing HTTP server gracefully')
  server.close(() => {
    console.log('✅ HTTP server closed')
    process.exit(0)
  })
})

console.log('🛡️  Global error handlers installed - server is crash-proof')
