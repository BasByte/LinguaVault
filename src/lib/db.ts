import { prisma } from "@/lib/prisma";

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await prisma.$queryRawUnsafe<T[]>(text, ...(params ?? []));
  return result;
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await prisma.$queryRawUnsafe<T[]>(text, ...(params ?? []));
  return result[0] ?? null;
}

export { prisma };
