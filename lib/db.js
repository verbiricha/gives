import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({
  rejectOnNotFound: false,
})

export default db
