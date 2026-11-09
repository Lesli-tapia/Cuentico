import { PrismaClient } from '@prisma/client';

const globalDatabase = globalThis as unknown as { cuenticoDatabase?: PrismaClient };
export const db = globalDatabase.cuenticoDatabase ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalDatabase.cuenticoDatabase = db;
