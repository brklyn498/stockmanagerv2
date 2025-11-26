import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'admin@stockmanager.com' },
    update: {},
    create: {
      email: 'admin@stockmanager.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  })
  console.log('Created user:', user.email)

  // Create categories
  const categories = [
    { name: 'Electronics', description: 'Electronic devices and components' },
    { name: 'Furniture', description: 'Office and home furniture' },
    { name: 'Stationery', description: 'Office supplies and stationery' },
    { name: 'Food & Beverage', description: 'Food and drink products' },
    { name: 'Clothing', description: 'Apparel and accessories' },
  ]

  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
    console.log('Created category:', category.name)
  }

  // Create suppliers
  const suppliers = [
    {
      name: 'Tech Supplies Inc.',
      email: 'contact@techsupplies.com',
      phone: '555-0101',
      address: '123 Tech Street, Silicon Valley, CA',
    },
    {
      name: 'Office Depot',
      email: 'sales@officedepot.com',
      phone: '555-0102',
      address: '456 Office Blvd, New York, NY',
    },
    {
      name: 'Global Distributors',
      email: 'info@globaldist.com',
      phone: '555-0103',
      address: '789 Commerce Ave, Chicago, IL',
    },
  ]

  for (const sup of suppliers) {
    const supplier = await prisma.supplier.create({
      data: sup,
    })
    console.log('Created supplier:', supplier.name)
  }

  console.log('Seed completed successfully!')
}

main()
  .catch(e => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
