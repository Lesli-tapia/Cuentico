import { PrismaClient } from '@prisma/client';
import { DatabaseConfigurationError } from './database-configuration';

const globalDatabase = globalThis as unknown as { cuenticoDatabase?: PrismaClient };
export function getDatabaseClient(): PrismaClient {
  if (!process.env.DATABASE_URL) throw new DatabaseConfigurationError('Falta configurar la conexión de guardado.');
  const client = globalDatabase.cuenticoDatabase ?? new PrismaClient();
  globalDatabase.cuenticoDatabase = client;
  return client;
}
