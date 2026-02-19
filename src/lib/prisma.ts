// autoloan-nextjs-metafullstack/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { _prisma: PrismaClient | undefined };

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (!globalForPrisma._prisma) {
      globalForPrisma._prisma = new PrismaClient();
    }
    return Reflect.get(globalForPrisma._prisma, prop);
  },
});
