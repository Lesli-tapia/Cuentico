import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const localSchemaPath = join(projectRoot, 'prisma', 'schema.prisma');
export const postgresSchemaPath = join(projectRoot, 'prisma', 'postgresql', 'schema.prisma');

/** Both database providers share one model source; only their connection block differs. */
export function createPostgresSchema(source) {
  const datasourcePattern = /^datasource\s+db\s*\{[\s\S]*?^\}/gm;
  const matches = [...source.matchAll(datasourcePattern)];
  if (matches.length !== 1 || !/provider\s*=\s*"sqlite"/.test(matches[0][0])) {
    throw new Error('El modelo principal debe contener un único datasource db de SQLite.');
  }
  const datasource = [
    'datasource db {',
    '  provider  = "postgresql"',
    '  url       = env("DATABASE_URL")',
    '  directUrl = env("DIRECT_DATABASE_URL")',
    '}'
  ].join('\n');
  return '// Generado desde prisma/schema.prisma por scripts/prepare-postgres.mjs.\n'
    + '// Edita los modelos en el esquema principal y vuelve a generar este archivo.\n\n'
    + source.replace(datasourcePattern, datasource).replaceAll('\r\n', '\n');
}

export async function preparePostgresSchema({ check = false } = {}) {
  const expected = createPostgresSchema(await readFile(localSchemaPath, 'utf8'));
  const current = await readFile(postgresSchemaPath, 'utf8').catch(error => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (current !== expected) {
    if (check) throw new Error('El esquema PostgreSQL está desactualizado. Ejecuta node scripts/prepare-postgres.mjs.');
    await mkdir(dirname(postgresSchemaPath), { recursive: true });
    await writeFile(postgresSchemaPath, expected, 'utf8');
  }
  return postgresSchemaPath;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await preparePostgresSchema({ check: process.argv.includes('--check') });
    console.log(process.argv.includes('--check') ? 'Esquema PostgreSQL actualizado.' : 'Esquema PostgreSQL preparado.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
