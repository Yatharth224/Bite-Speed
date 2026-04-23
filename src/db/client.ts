import { PrismaClient } from "@prisma/client"

// single db connection for the whole app
// we dont create this multiple times, just import this wherever we need db access
const db = new PrismaClient()

export default db