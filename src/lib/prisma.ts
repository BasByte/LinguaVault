import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import "dotenv"

declare global {
  var _prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = global._prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global._prisma = prisma;
}

export { prisma };
