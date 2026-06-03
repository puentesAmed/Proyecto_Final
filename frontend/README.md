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
- ExcelJS

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

## Importación

La plantilla principal de importación se descarga en formato Excel `.xlsx` desde la página de Importar.
Incluye una hoja `Cashflows`, una hoja `Instrucciones`, filas de ejemplo y validaciones para:

```text
type: in | out
status: pending | paid | cancelled
```

El CSV se mantiene como compatibilidad secundaria con las mismas columnas:

```text
accountAlias, categoryName, counterpartyNif, date, amount, type, concept, status
```
