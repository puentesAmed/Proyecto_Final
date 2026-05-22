# Previsión de Tesorería — Proyecto Final Fullstack

Aplicación fullstack para gestionar movimientos financieros (ingresos y gastos), visualizar KPIs y reportes, y mantener persistencia real en base de datos con autenticación JWT.

---

## 1) Objetivo del proyecto

Este proyecto fue construido como entrega final fullstack, priorizando:

- Flujo real de usuario (registro, login, logout y rutas protegidas).
- Persistencia en base de datos (sin depender de `localStorage` para datos de negocio).
- Arquitectura frontend + backend desacoplada vía API REST.
- Operaciones CRUD sobre movimientos (`cashflows`) con validaciones.
- Base de código mantenible, clara y defendible en exposición académica.

---

## 2) Arquitectura general

### Frontend (`/frontend`)
- **Stack:** React + Vite + Chakra UI + React Router + Zustand.
- **Responsabilidad:** interfaz de usuario, navegación, formularios, consumo de API, estado de sesión (token/usuario) y notificaciones.

### Backend (`/backend`)
- **Stack:** Node.js + Express + Mongoose.
- **Responsabilidad:** autenticación, autorización, validación, lógica de negocio, endpoints REST y acceso a MongoDB.

### Base de datos
- **Motor:** MongoDB.
- **Persistencia principal:** usuarios, cuentas, categorías, contrapartes y cashflows.

---

## 3) Estructura de carpetas

```text
.
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── state/
│   │   ├── ui/
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── app.js
│   │   └── index.js
│   ├── scripts/
│   ├── data/
│   └── package.json
├── .env.example
├── package.json
└── README.md
```

---

## 4) Funcionalidades principales

- Registro de usuario con email, nombre y contraseña.
- Inicio/cierre de sesión con token JWT.
- Protección de rutas frontend y endpoints backend.
- Gestión de movimientos (`cashflows`) con creación, edición, listado y borrado.
- Dashboard con indicadores y visualizaciones.
- Módulos de cuentas, categorías, calendario e importación (según rol).
- Notificaciones en interfaz sin `alert()` del navegador.

---

## 5) Tecnologías usadas

### Frontend
- React 19
- Vite
- Chakra UI
- React Router
- React Hook Form + Zod
- Zustand
- Axios
- Recharts / FullCalendar (visualizaciones)

### Backend
- Node.js
- Express
- Mongoose
- JWT (`jsonwebtoken`)
- Bcrypt
- Helmet
- CORS
- Morgan
- Express Rate Limit
- Multer (importaciones)

---

## 6) Requisitos previos

- Node.js **20.x**
- npm **9+**
- MongoDB local o remoto

> Recomendado: usar la misma versión de Node en frontend/backend para evitar diferencias de build.

---

## 7) Variables de entorno

Hay un archivo base en `.env.example`.

### Backend (`backend/.env`)

```env
PORT=3000
MONGODB_URI=
JWT_SECRET=replace_with_a_long_random_secret
CORS_ORIGINS=http://localhost:5173
```

### Frontend (`frontend/.env.local`)

```env
VITE_API_URL=http://localhost:3000/api
```

### Notas importantes
- No subir `.env` reales al repositorio.
- `JWT_SECRET` debe ser largo y aleatorio en entornos productivos.
- `CORS_ORIGINS` debe incluir los dominios permitidos del frontend.

---

## 8) Instalación

Desde la raíz del proyecto:

```bash
npm install
```

Crear archivos de entorno:

1. `backend/.env` a partir de `.env.example`.
2. `frontend/.env` con `VITE_API_URL`.

Levantar MongoDB y comprobar conexión.

---

## 9) Ejecución en desarrollo

### Levantar frontend + backend

```bash
npm run dev
```

### Solo backend

```bash
npm run dev -w backend
```

### Solo frontend

```bash
npm run dev -w frontend
```

---

## 10) Scripts disponibles

### Raíz
- `npm run dev` → ejecuta backend y frontend en paralelo.
- `npm run build` → ejecuta build de workspaces (nota: backend no define `build` actualmente).
- `npm run seed` → ejecuta seed del backend.

### Backend
- `npm run dev -w backend` → nodemon.
- `npm run start -w backend` → arranque normal.
- `npm run seed -w backend` → carga datos semilla.
- `npm run seed:categories -w backend`
- `npm run seed:users -w backend`
- `npm run fix:cashflow-signs -w backend`

### Frontend
- `npm run dev -w frontend`
- `npm run build -w frontend`
- `npm run preview -w frontend`
- `npm run lint -w frontend`

---

## 11) Autenticación y autorización

### Flujo de autenticación
1. Usuario se registra (`/api/auth/register`) con `name`, `email`, `password`.
2. Backend hashea contraseña con bcrypt.
3. Backend genera JWT y responde con `token + user`.
4. Frontend persiste sesión (estado auth) y adjunta token Bearer en peticiones.

### Protección
- Backend valida JWT en middleware `requireAuth`.
- Endpoints sensibles usan `requireAdmin`.
- Frontend redirige a login cuando falta sesión/token.

### Aislamiento de datos
- Los cashflows quedan asociados al usuario autenticado.
- Listados y mutaciones trabajan sobre el `user` del token para evitar mezcla de datos entre usuarios.

---

## 12) API (resumen de endpoints)

> Prefijo base: `/api`

### Auth
- `POST /auth/register`
- `POST /auth/login`

### Cashflows
- `GET /cashflows`
- `POST /cashflows`
- `PUT /cashflows/:id`
- `DELETE /cashflows/:id`
- `PATCH /cashflows/:id/status`
- `GET /cashflows/calendar`
- `GET /cashflows/upcoming`
- `GET /cashflows/monthly`

### Otros módulos
- `/accounts`
- `/categories`
- `/counterparties`
- `/reports`
- `/scenarios`
- `/registration-invites` (módulo legacy administrativo)

---

## 13) Datos de ejemplo (seed)

Para cargar datos iniciales:

```bash
npm run seed
```

Esto ejecuta scripts del backend que crean/actualizan información de referencia y datos de prueba.

---

## 14) Calidad, seguridad y buenas prácticas

- Contraseñas no se guardan en texto plano.
- Uso de JWT con expiración.
- CORS y Helmet habilitados.
- Rate limit básico para endurecer API.
- Manejo de errores con respuestas JSON.
- Código organizado por rutas/controladores/modelos.

---

## 15) Limitaciones actuales conocidas

- El workspace backend no tiene `npm run build` propio; por eso `npm run build` en raíz puede fallar.
- Existen módulos legacy (`registration-invites`) que hoy no son requisito para el registro de usuario final.
- Sería recomendable añadir una suite mínima de tests de integración para auth y cashflows.

---

## 16) Mejoras futuras recomendadas

- Agregar tests automáticos (API + UI).
- Añadir refresh token / estrategia de renovación de sesión.
- Añadir paginación y búsqueda avanzada en cashflows.
- Incorporar auditoría de acciones críticas por usuario/rol.
- Completar documentación OpenAPI/Swagger.

---

## 17) Guía rápida para defensa académica

Si necesitas exponer el proyecto:

1. Explicar arquitectura fullstack y separación de responsabilidades.
2. Mostrar registro/login real contra backend.
3. Demostrar ruta protegida sin token.
4. Crear/editar/eliminar un cashflow y refrescar para probar persistencia.
5. Mostrar que un usuario no ve datos de otro (aislamiento por usuario).
6. Enseñar `.env.example` y prácticas de seguridad básicas.

---

## 18) Licencia y uso

Proyecto de uso académico para entrega final fullstack.
