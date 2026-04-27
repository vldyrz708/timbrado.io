# Timbrado.io

## Desarrollo local

1. `npm install`
2. `npm run dev`

El sitio se compila a `dist/` y queda disponible en `http://localhost:3000`.

## Build

1. `npm run build`

Esto genera la carpeta `dist/`, que es la misma que usa Vercel para desplegar.

## Despliegue en Vercel

1. Sube el repositorio a GitHub, GitLab o Bitbucket.
2. Importa el proyecto en Vercel.
3. Vercel detectará la configuración de [vercel.json](/d:/Angel/Escritorio/timbrado.io/vercel.json).

Configuración usada:

- `installCommand`: `npm ci`
- `buildCommand`: `npm run build`
- `outputDirectory`: `dist`

Con eso el proyecto queda listo para deploy directo sin pasos extra.

