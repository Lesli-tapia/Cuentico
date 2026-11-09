import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

const portIndex = process.argv.indexOf('--port');
const port = portIndex >= 0 ? Number(process.argv[portIndex + 1]) : 3000;
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Puerto de desarrollo inválido.');
const cli = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url));
const server = spawn(process.execPath, [cli, 'dev', '--hostname', '127.0.0.1', '--port', String(port)], { stdio: 'inherit', env: process.env });
let exited = false;
server.once('error', error => { console.error(error); process.exitCode = 1; exited = true; });
server.once('exit', code => { process.exitCode = code ?? 1; exited = true; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

// Compile each route pattern sequentially before browser link prefetching starts.
// This avoids Next 16's concurrent development prerender-manifest writes (#96259).
const catalog = JSON.parse(await readFile(new URL('../content/catalog.json', import.meta.url), 'utf8'));
const paths = ['/api/app', '/', '/onboarding', '/libreria', '/favoritos', '/perfil', '/coleccion',
  ...catalog.stories.filter(story => story.available).flatMap(story => [`/cuentos/${story.id}`,
    ...['preparacion', 'lectura', 'fin', 'actividad', 'recompensa', 'valoracion'].map(step => `/cuentos/${story.id}/${step}`)])];
try {
  const deadline = Date.now() + 180_000;
  for (const path of paths) {
    while (true) {
      if (exited || Date.now() > deadline) throw new Error('No pudimos preparar el servidor de desarrollo.');
      try {
        const response = await fetch(`http://127.0.0.1:${port}${path}`, { signal: AbortSignal.timeout(30_000) });
        await response.text();
        if (response.ok) break;
      } catch { /* Next may still be opening its local port. */ }
      await pause(300);
    }
  }
  console.log(`\nCuentico listo: http://127.0.0.1:${port}\n`);
} catch (error) { console.error(error); server.kill(); process.exitCode = 1; }
