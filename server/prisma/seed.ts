import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting seed...')

  // 1. Create User
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: 'password123',
    },
  })
  console.log(`Created user: ${user.email}`)

  // 2. Create Slip
  const slip = await prisma.slip.create({
    data: {
      filename: 'receipt-001.jpg',
      originalName: 'coffee_receipt.jpg',
      status: 'completed',
      userId: user.id,
      ocrResult: { items: ['Latte', 'Muffin'], total: 12.5 },
      processedAt: new Date(),
    },
  })

  // 3. Create Transactions
  await prisma.transaction.createMany({
    data: [
      {
        type: 'expense',
        amount: 12.5,
        description: 'Morning Coffee',
        category: 'Food & Drink',
        date: new Date(),
        userId: user.id,
        slipId: slip.id,
      },
      {
        type: 'income',
        amount: 3500,
        description: 'Monthly Salary',
        category: 'Salary',
        date: new Date(),
        userId: user.id,
      },
    ],
  })

  console.log('✅ Seeding finished.')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
