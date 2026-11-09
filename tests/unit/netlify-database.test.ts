import { describe, expect, it } from 'vitest';
import { createNetlifyBuildPlan } from '../../scripts/build-netlify';
import { DatabaseConfigurationError, redactDatabaseSecrets, resolvePostgresEnvironment } from '../../src/server/database-configuration';

const pooled = 'postgresql://tester:example-password@pool.example.test/cuentico?sslmode=require';
const direct = 'postgresql://tester:other-example-password@direct.example.test/cuentico?sslmode=require';

describe('guardado persistente de Netlify', () => {
  it('impide desplegar con SQLite o sin una conexión de guardado', () => {
    for (const value of [undefined, '', 'file:./dev.db', 'https://example.test/db', 'postgresql://host.test']) {
      expect(() => resolvePostgresEnvironment({ DATABASE_URL: value })).toThrow(DatabaseConfigurationError);
    }
  });
  it('usa una conexión PostgreSQL única o separa la directa de la conexión de ejecución', () => {
    expect(resolvePostgresEnvironment({ DATABASE_URL: pooled }).directDatabaseUrl).toBe(pooled);
    const result = resolvePostgresEnvironment({ DATABASE_URL: pooled, DIRECT_DATABASE_URL: direct });
    expect(result.databaseUrl).toBe(pooled);
    expect(result.directDatabaseUrl).toBe(direct);
  });
  it('no muestra contraseñas en errores de configuración ni en registros del despliegue', () => {
    const invalid = 'postgresql://secret-name:super-secret-password@';
    try { resolvePostgresEnvironment({ DATABASE_URL: invalid }); throw new Error('Expected configuration error'); }
    catch (error) {
      expect(error).toBeInstanceOf(DatabaseConfigurationError);
      expect(String(error)).not.toContain('super-secret-password');
      expect(String(error)).not.toContain('secret-name');
    }
    const output = redactDatabaseSecrets(`failed ${pooled}\nother postgres://another:password@host.test/database`, [pooled, direct]);
    expect(output).not.toContain('example-password');
    expect(output).not.toContain('another:password');
    expect(output).toContain('[conexión protegida]');
  });
  it('crea tablas y contenido antes de compilar la versión de producción', () => {
    const result = createNetlifyBuildPlan({ DATABASE_URL: pooled, DIRECT_DATABASE_URL: direct, CONTEXT: 'production' });
    expect(result.stages.map(stage => stage.label)).toEqual([
      'Preparar el modelo PostgreSQL', 'Generar el cliente PostgreSQL', 'Aplicar migraciones PostgreSQL', 'Cargar los cuentos originales', 'Compilar Cuentico'
    ]);
    expect(result.stages.find(stage => stage.args.includes('deploy'))?.args).toContain('prisma/postgresql/schema.prisma');
    expect(result.stages.filter(stage => stage.directConnection).map(stage => stage.label)).toEqual(['Aplicar migraciones PostgreSQL', 'Cargar los cuentos originales']);
  });
  it('las vistas previas no migran ni cargan contenido sobre una base compartida por defecto', () => {
    const result = createNetlifyBuildPlan({ DATABASE_URL: pooled, CONTEXT: 'deploy-preview' });
    expect(result.stages.some(stage => stage.args.includes('deploy'))).toBe(false);
    expect(result.stages.some(stage => stage.args.includes('prisma/seed.ts'))).toBe(false);
    expect(resolvePostgresEnvironment({ DATABASE_URL: pooled, CONTEXT: 'branch-deploy', CUENTICO_INITIALIZE_DATABASE: 'true' }).initializeDatabase).toBe(true);
  });
});
