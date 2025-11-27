import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  })
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

// Log slow queries in development
if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query' as never, (e: any) => {
    if (e.duration > 1000) {
      console.log(`⚠️  Slow query detected (${e.duration}ms):`, e.query)
    }
  })
}

/**
 * Explicitly connect to the database with retry logic
 */
export const connectDatabase = async (retries = 3): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔌 Connecting to database (attempt ${attempt}/${retries})...`)
      await prisma.$connect()

      // Verify connection with a simple query
      await prisma.$queryRaw`SELECT 1`

      console.log('✅ Database connected successfully')
      return
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt} failed:`, error)

      if (attempt === retries) {
        throw new Error('Failed to connect to database after multiple attempts')
      }

      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
      console.log(`⏳ Waiting ${delay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

/**
 * Gracefully disconnect from the database
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    console.log('🔌 Disconnecting from database...')
    await prisma.$disconnect()
    console.log('✅ Database disconnected successfully')
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error)
  }
}

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
