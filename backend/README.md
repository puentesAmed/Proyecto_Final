# Backend — Previsión de Tesorería

Este directorio contiene la API REST del proyecto.

La documentación principal está en el README de la raíz del repositorio.

## Stack

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- Bcrypt
- Helmet
- CORS
- Morgan
- Express Rate Limit
- csv-parse
- xlsx

## Variables de entorno

Crear:

```text
backend/.env
```

Ejemplo local:

```env
PORT=3000
MONGO_URI=
JWT_SECRET=cambia_este_secret_por_un_valor_largo
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173
```

## Comandos

```bash
npm install
npm run dev
npm start
npm run seed
```

## URL local

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/health
```

## Importación de cashflows

El endpoint `POST /api/cashflows/import` acepta Excel `.xlsx` y `.xls` como formato principal, y mantiene `.csv` como compatibilidad secundaria.

En archivos Excel se lee la primera hoja del libro. La plantilla recomendada se descarga desde el frontend y contiene una hoja `Cashflows` con estas columnas:

```text
accountAlias, categoryName, counterpartyNif, date, amount, type, concept, status
```

Validaciones aplicadas por backend:

```text
date válida
amount numérico
type: in | out
status: pending | paid | cancelled
accountAlias existente
```

La respuesta de importación incluye:

```text
totalRows, inserted, skipped, errors
```
