import path from 'node:path';
import { fileURLToPath } from 'node:url';
import browserSync from 'browser-sync';
import { buildSite } from './build.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

const bs = browserSync.create();
let rebuilding = false;
let queued = false;

async function rebuild() {
  if (rebuilding) {
    queued = true;
    return;
  }

  rebuilding = true;

  try {
    await buildSite();
    bs.reload();
    console.log('Cambios compilados.');
  } catch (error) {
    console.error('Error durante el rebuild.');
    console.error(error);
  } finally {
    rebuilding = false;

    if (queued) {
      queued = false;
      await rebuild();
    }
  }
}

async function run() {
  await buildSite();

  bs.init({
    server: distDir,
    port: 3000,
    open: false,
    notify: false,
  });

  console.log('Servidor listo en http://localhost:3000');

  const watcher = (eventType, filename) => {
    if (!filename) {
      return;
    }

    console.log(`Cambio detectado: ${eventType} ${filename}`);
    void rebuild();
  };

  process.on('SIGINT', () => {
    bs.exit();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    bs.exit();
    process.exit(0);
  });

  fs.watch(srcDir, { recursive: true }, watcher);
}

import fs from 'node:fs';

run().catch((error) => {
  console.error('No se pudo iniciar el modo dev.');
  console.error(error);
  process.exit(1);
});
