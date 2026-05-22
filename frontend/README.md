# Frontend — Previsión de Tesorería

Este directorio contiene el frontend React/Vite del proyecto.

La documentación principal está en el README de la raíz del repositorio.

## Stack

- React
- Vite
- Chakra UI
- React Router
- React Hook Form
- Zod
- Zustand
- Axios
- FullCalendar
- Recharts

## Variables de entorno

Crear:

```text
frontend/.env.local
```

Contenido local:

```env
VITE_API_URL=http://localhost:3000/api
```

## Comandos

```bash
npm install
npm run dev
npm run build
npm run preview
```

## URL local

```text
http://localhost:5173
```

## Nota

El frontend no debe llamar directamente a rutas relativas como `/auth/register`.
Las llamadas deben pasar por el cliente centralizado de Axios usando `VITE_API_URL`.
