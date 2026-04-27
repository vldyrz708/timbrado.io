import { rm, mkdir, readdir, readFile, writeFile, copyFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');
const partialIncludePattern = /@@include\(["'](.+?)["']\)/g;

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

async function emptyDir(dirPath) {
  await rm(dirPath, { recursive: true, force: true });
  await ensureDir(dirPath);
}

async function copyDir(sourceDir, targetDir) {
  await ensureDir(targetDir);
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
      continue;
    }

    await copyFile(sourcePath, targetPath);
  }
}

async function resolveIncludes(filePath) {
  let content = await readFile(filePath, 'utf8');

  const replacements = [...content.matchAll(partialIncludePattern)];
  for (const match of replacements) {
    const includeRelativePath = match[1];
    const includeAbsolutePath = path.resolve(path.dirname(filePath), includeRelativePath);
    const includedContent = await resolveIncludes(includeAbsolutePath);
    content = content.replace(match[0], includedContent);
  }

  return content;
}

async function buildHtml() {
  const sourceHtmlPath = path.join(srcDir, 'index.html');
  const outputHtmlPath = path.join(distDir, 'index.html');
  const compiledHtml = await resolveIncludes(sourceHtmlPath);
  await writeFile(outputHtmlPath, compiledHtml, 'utf8');
}

async function copyStaticFiles() {
  const entries = await readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'partials' || entry.name === 'index.html') {
      continue;
    }

    const sourcePath = path.join(srcDir, entry.name);
    const targetPath = path.join(distDir, entry.name);

    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
      continue;
    }

    await copyFile(sourcePath, targetPath);
  }
}

export async function buildSite() {
  await emptyDir(distDir);
  await Promise.all([buildHtml(), copyStaticFiles()]);
}

async function run() {
  try {
    await buildSite();
    const distStats = await stat(distDir);
    if (!distStats.isDirectory()) {
      throw new Error('No se pudo generar la carpeta dist.');
    }
    console.log('Build listo en dist/');
  } catch (error) {
    console.error('Error al construir el proyecto.');
    console.error(error);
    process.exitCode = 1;
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  await run();
}
