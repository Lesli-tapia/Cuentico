export class DatabaseConfigurationError extends Error {
  constructor(message: string) { super(message); this.name = 'DatabaseConfigurationError'; }
}

export type Environment = Record<string, string | undefined>;
export interface PostgresEnvironment {
  databaseUrl: string;
  directDatabaseUrl: string;
  initializeDatabase: boolean;
}

function postgresUrl(value: string | undefined, variable: string): string {
  if (!value?.trim()) throw new DatabaseConfigurationError(`Falta ${variable}. Configura una conexión PostgreSQL en las variables de entorno de Netlify.`);
  try {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || url.pathname.length < 2) throw new Error();
    return value;
  } catch {
    throw new DatabaseConfigurationError(`${variable} debe ser una conexión PostgreSQL válida. SQLite local no guarda datos de forma persistente en Netlify.`);
  }
}

/** Deployment configuration only: no connections or resources are created here. */
export function resolvePostgresEnvironment(environment: Environment): PostgresEnvironment {
  const databaseUrl = postgresUrl(environment.DATABASE_URL, 'DATABASE_URL');
  const directDatabaseUrl = postgresUrl(environment.DIRECT_DATABASE_URL || databaseUrl, 'DIRECT_DATABASE_URL');
  return {
    databaseUrl,
    directDatabaseUrl,
    // Preview builds must not automatically migrate the production database.
    initializeDatabase: !environment.CONTEXT || environment.CONTEXT === 'production' || environment.CUENTICO_INITIALIZE_DATABASE === 'true'
  };
}

export function redactDatabaseSecrets(output: string, urls: readonly string[]): string {
  let sanitized = output;
  for (const url of urls) if (url) sanitized = sanitized.replaceAll(url, '[conexión protegida]');
  return sanitized.replace(/postgres(?:ql)?:\/\/[^\s'"<>]+/gi, '[conexión protegida]');
}
