import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { DatabaseConfigurationError, redactDatabaseSecrets, resolvePostgresEnvironment, type Environment } from '../src/server/database-configuration';

export interface BuildStage { label: string; executable: string; args: string[]; directConnection?: boolean }
export function createNetlifyBuildPlan(environment: Environment) {
  const configuration = resolvePostgresEnvironment(environment);
  const schema = 'prisma/postgresql/schema.prisma';
  const stages: BuildStage[] = [
    { label: 'Preparar el modelo PostgreSQL', executable: 'scripts/prepare-postgres.mjs', args: [] },
    { label: 'Generar el cliente PostgreSQL', executable: 'node_modules/prisma/build/index.js', args: ['generate', '--schema', schema] }
  ];
  if (configuration.initializeDatabase) stages.push(
    { label: 'Aplicar migraciones PostgreSQL', executable: 'node_modules/prisma/build/index.js', args: ['migrate', 'deploy', '--schema', schema], directConnection: true },
    { label: 'Cargar los cuentos originales', executable: 'node_modules/tsx/dist/cli.mjs', args: ['prisma/seed.ts'], directConnection: true }
  );
  stages.push({ label: 'Compilar Cuentico', executable: 'node_modules/next/dist/bin/next', args: ['build'] });
  return { configuration, stages };
}

function main() {
  try {
    const plan = createNetlifyBuildPlan(process.env);
    if (process.argv.includes('--check')) {
      console.log(JSON.stringify({ provider: 'postgresql', initializeDatabase: plan.configuration.initializeDatabase, stages: plan.stages.map(stage => stage.label) }, null, 2));
      return;
    }
    if (!plan.configuration.initializeDatabase) console.log('Vista previa: se compila sin modificar la base de datos. Usa una conexión aislada para probar cambios de esquema.');
    for (const stage of plan.stages) {
      console.log(`\nCuentico: ${stage.label}`);
      const result = spawnSync(process.execPath, [resolve(stage.executable), ...stage.args], {
        encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
        env: {
          ...process.env, RUST_LOG: 'info',
          DATABASE_URL: stage.directConnection ? plan.configuration.directDatabaseUrl : plan.configuration.databaseUrl,
          DIRECT_DATABASE_URL: plan.configuration.directDatabaseUrl
        }
      });
      const secrets = [plan.configuration.databaseUrl, plan.configuration.directDatabaseUrl];
      if (result.stdout) process.stdout.write(redactDatabaseSecrets(result.stdout, secrets));
      if (result.stderr) process.stderr.write(redactDatabaseSecrets(result.stderr, secrets));
      if (result.error || result.status !== 0) throw new Error(`No se completó: ${stage.label}. Revisa el registro anterior.`);
    }
  } catch (error) {
    console.error(error instanceof DatabaseConfigurationError || error instanceof Error ? error.message : 'No se pudo preparar el despliegue.');
    process.exitCode = 1;
  }
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/scripts/build-netlify.ts')) main();
