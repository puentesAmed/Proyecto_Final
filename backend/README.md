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
