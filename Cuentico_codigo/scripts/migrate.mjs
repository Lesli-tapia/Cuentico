import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const cli = fileURLToPath(new URL('../node_modules/prisma/build/index.js', import.meta.url));
// Prisma 6's SQLite existence check needs INFO logs (upstream issue #29355).
const result = spawnSync(process.execPath, [cli, 'migrate', 'deploy'], {
  stdio: 'inherit', env: { ...process.env, RUST_LOG: 'info' }
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
