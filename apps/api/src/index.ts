import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes'
import productRoutes from './routes/productRoutes'
import categoryRoutes from './routes/categoryRoutes'
import supplierRoutes from './routes/supplierRoutes'
import stockMovementRoutes from './routes/stockMovementRoutes'
import orderRoutes from './routes/orderRoutes'
import dashboardRoutes from './routes/dashboardRoutes'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const PORT = process.env.API_PORT || 3001

app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Stock Manager API v2' })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/stock-movements', stockMovementRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/dashboard', dashboardRoutes)

// Error handling middleware (must be last)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`)
})
