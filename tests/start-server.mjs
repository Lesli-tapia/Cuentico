import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

// Every Playwright invocation uses an empty SQLite database; dev progress is untouched.
const env = { ...process.env, RUST_LOG: 'info', DATABASE_URL: `file:./e2e-${Date.now()}.db` };
const run = (script, args) => new Promise((resolveRun, reject) => {
  const processRun = spawn(process.execPath, [resolve(script), ...args], { env, stdio: 'inherit' });
  processRun.once('error', reject);
  processRun.once('exit', code => code === 0 ? resolveRun() : reject(new Error(`Setup exited ${code}`)));
});
await run('node_modules/prisma/build/index.js', ['generate', '--schema', 'prisma/schema.prisma']);
await run('node_modules/prisma/build/index.js', ['migrate', 'deploy']);
await run('node_modules/tsx/dist/cli.mjs', ['prisma/seed.ts']);
const development = process.env.CUENTICO_E2E_DEV === '1';
if (!development) await run('node_modules/next/dist/bin/next', ['build']);
const server = spawn(process.execPath, development
  ? [resolve('scripts/start-dev.mjs'), '--port', '3100']
  : [resolve('node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', '3100'], { env, stdio: 'inherit' });
server.once('error', error => { console.error(error); process.exitCode = 1; });
server.once('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
