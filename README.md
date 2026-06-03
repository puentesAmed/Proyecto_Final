# Previsión de Tesorería — Proyecto Final Fullstack

Aplicación fullstack para gestionar previsiones de tesorería, cuentas, ingresos, gastos, categorías, contrapartes, calendario financiero, reportes y escenarios. El proyecto está dividido en un frontend React y una API REST en Node.js/Express conectada a MongoDB.

Este README está pensado como documentación principal del proyecto completo.

---

## Índice

- [Objetivo](#objetivo)
- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Modelo funcional](#modelo-funcional)
- [Requisitos](#requisitos)
- [Variables de entorno](#variables-de-entorno)
- [Instalación](#instalación)
- [Ejecución en desarrollo](#ejecución-en-desarrollo)
- [Seed de datos](#seed-de-datos)
- [Autenticación](#autenticación)
- [API principal](#api-principal)
- [Frontend](#frontend)
- [Backend](#backend)
- [Comprobaciones manuales](#comprobaciones-manuales)
- [Build y despliegue](#build-y-despliegue)
- [Solución de problemas](#solución-de-problemas)
- [Mejoras futuras](#mejoras-futuras)

---

## Objetivo

El objetivo del proyecto es construir una aplicación fullstack de previsión de tesorería que permita:

- Registrar e iniciar sesión con usuarios reales.
- Proteger rutas mediante token JWT.
- Consultar cuentas de tesorería.
- Crear, listar, editar y eliminar movimientos financieros.
- Diferenciar ingresos y gastos.
- Asociar movimientos a cuentas, categorías y contrapartes.
- Visualizar vencimientos en calendario.
- Consultar totales, reportes y escenarios.
- Mantener datos persistentes en MongoDB.

La aplicación no depende de datos simulados en `localStorage` para la información principal. El frontend consume una API REST y el backend persiste los datos en base de datos.

---

## Arquitectura

```text
Frontend React/Vite
        │
        │ HTTP + JWT Bearer
        ▼
Backend Node.js + Express
        │
        │ Mongoose
        ▼
MongoDB / MongoDB Atlas
```

### Frontend

Responsable de:

- Interfaz de usuario.
- Formularios.
- Validaciones básicas de entrada.
- Navegación y rutas protegidas.
- Estado de sesión.
- Consumo de API mediante Axios.
- Notificaciones de usuario.
- Visualización de calendario, KPIs y reportes.

### Backend

Responsable de:

- Autenticación y autorización.
- Validaciones de seguridad.
- Endpoints REST.
- Gestión de usuarios, cuentas, categorías, contrapartes y cashflows.
- Conexión con MongoDB mediante Mongoose.
- Seed de datos iniciales.
- CORS, Helmet, rate limit y middleware de seguridad.

### Base de datos

MongoDB almacena:

- `users`
- `accounts`
- `categories`
- `counterparties`
- `cashflows`
- `scenarios`
- otros documentos auxiliares del proyecto

---

## Tecnologías

### Frontend

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

### Backend

- Node.js
- Express
- Mongoose
- MongoDB / MongoDB Atlas
- JSON Web Token
- Bcrypt
- Helmet
- CORS
- Morgan
- Express Rate Limit
- csv-parse
- xlsx

---

## Estructura del proyecto

```text
.
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   └── api.js
│   │   ├── state/
│   │   ├── styles/
│   │   └── ui/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── data/
│   │   ├── accounts.csv
│   │   ├── cashflows.csv
│   │   ├── categories.csv
│   │   └── counterparties.csv
│   ├── scripts/
│   │   └── seed.js
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js
│   │   │   └── mongo.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   │   ├── Account.js
│   │   │   ├── Cashflow.js
│   │   │   ├── Category.js
│   │   │   ├── Counterparty.js
│   │   │   ├── Scenario.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   ├── app.js
│   │   └── index.js
│   └── package.json
│
├── package.json
├── .env.example
└── README.md
```

---

## Modelo funcional

### User

Representa al usuario que accede a la aplicación.

Campos principales:

- `name`
- `email`
- `passwordHash`
- `role`

El usuario demo del seed es:

```text
Email: admin@demo.com
Contraseña: Admin123!
Rol: admin
```

### Account

Representa una cuenta real de tesorería sobre la que se asocian ingresos y gastos.

Campos principales:

- `alias`
- `bank`
- `nummber`
- `color`
- `currency`
- `initialBalance`
- `currentBalance`

Nota: el campo `nummber` se mantiene con ese nombre por compatibilidad con el modelo actual.

### Cashflow

Representa un ingreso o gasto.

Campos principales:

- `user`
- `date`
- `account`
- `counterparty`
- `amount`
- `type`
- `category`
- `concept`
- `status`

Valores admitidos:

```text
type: in | out
status: pending | paid | cancelled
```

Los cashflows pertenecen a un usuario y se asocian a una cuenta mediante referencia a `Account`.

### Category

Clasifica el movimiento financiero.

Ejemplos:

- Sueldo
- Alquiler
- Compras
- Transporte
- Servicios
- Impuestos

### Counterparty

Representa la persona, empresa o entidad asociada al movimiento.

---

## Requisitos

- Node.js 20.x recomendado
- npm 9 o superior
- MongoDB local o MongoDB Atlas
- Navegador moderno

---

## Variables de entorno

### Backend

Crear archivo:

```text
backend/.env
```

Ejemplo:

```env
PORT=3000
MONGO_URI=
JWT_SECRET=cambia_este_secret_por_un_valor_largo
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173
```

En MongoDB Atlas, `MONGO_URI` debe contener la cadena de conexión real del cluster.

### Frontend

Crear archivo:

```text
frontend/.env
```

Ejemplo local:

```env
VITE_API_URL=http://localhost:3000/api
```

Ejemplo producción:

```env
VITE_API_URL=https://tu-backend-produccion.com/api
```

---

## Instalación

Desde la raíz:

```bash
npm install
```

Si el proyecto no está configurado con workspaces, instalar cada parte por separado:

```bash
cd backend
npm install

cd ../frontend
npm install
```

---

## Ejecución en desarrollo

### Opción con workspaces desde la raíz

```bash
npm run dev
```

### Backend

```bash
cd backend
npm run dev
```

El backend queda disponible normalmente en:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/health
```

### Frontend

```bash
cd frontend
npm run dev
```

El frontend queda disponible normalmente en:

```text
http://localhost:5173
```

---

## Autenticación

La autenticación funciona mediante JWT.

Rutas principales:

```text
POST /api/auth/register
POST /api/auth/login
```

Flujo:

1. El usuario envía email y contraseña.
2. El backend valida credenciales.
3. La contraseña se compara con bcrypt.
4. El backend devuelve `user` y `token`.
5. El frontend guarda la sesión.
6. Axios envía el token en `Authorization: Bearer <token>`.

---

## API principal

Prefijo base:

```text
/api
```

### Auth

```text
POST /api/auth/register
POST /api/auth/login
```

### Accounts

```text
GET    /api/accounts
POST   /api/accounts
PATCH  /api/accounts/:id
DELETE /api/accounts/:id
```

### Cashflows

```text
GET    /api/cashflows
POST   /api/cashflows
PATCH  /api/cashflows/:id
PATCH  /api/cashflows/:id/status
DELETE /api/cashflows/:id
POST   /api/cashflows/import
```

La importación usa Excel `.xlsx` como plantilla principal y mantiene CSV como compatibilidad secundaria.
La plantilla se descarga desde el frontend con dos hojas: `Cashflows` e `Instrucciones`.
La hoja `Cashflows` incluye ejemplos y estas columnas:

```text
accountAlias, categoryName, counterpartyNif, date, amount, type, concept, status
```

El backend acepta `.xlsx`, `.xls` y `.csv`, lee la primera hoja en Excel y valida fecha, importe, tipo, estado y cuenta existente.
La respuesta devuelve `totalRows`, `inserted`, `skipped` y `errors`.

### Categories

```text
GET    /api/categories
POST   /api/categories
PATCH  /api/categories/:id
DELETE /api/categories/:id
```

### Counterparties

```text
GET    /api/counterparties
POST   /api/counterparties
PATCH  /api/counterparties/:id
DELETE /api/counterparties/:id
```

### Reports

```text
GET /api/reports/summary
GET /api/reports/by-category
GET /api/reports/by-account
```

### Scenarios

```text
GET    /api/scenarios
POST   /api/scenarios
PATCH  /api/scenarios/:id
DELETE /api/scenarios/:id
```

---

## Frontend

El frontend consume la API mediante el cliente centralizado:

```text
frontend/src/lib/api.js
```

Debe usar:

```js
baseURL: import.meta.env.VITE_API_URL
```

En local, la URL correcta es:

```text
http://localhost:3000/api
```

Si el registro intenta llamar a `http://localhost:5173/auth/register`, significa que `VITE_API_URL` no se está leyendo o no se está usando el cliente API centralizado.

---

## Backend

El backend monta las rutas en `src/app.js`.

Rutas principales:

```js
app.use('/api/auth', authRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/counterparties', counterpartiesRoutes)
app.use('/api/cashflows', cashflowRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/scenarios', scenariosRoutes)
app.use('/api/categories', categoriesRoutes)
```

La conexión con MongoDB está centralizada en:

```text
backend/src/config/mongo.js
```

La configuración de variables se gestiona en:

```text
backend/src/config/env.js
```

---

## Comprobaciones manuales

Antes de entregar:

1. Arrancar backend.
2. Arrancar frontend.
3. Confirmar conexión a MongoDB.
4. Ejecutar seed.
5. Entrar con `admin@demo.com` y `Admin123!`.
6. Ver cuentas cargadas.
7. Ver cashflows asociados a cuentas.
8. Crear un cashflow desde la interfaz.
9. Editar estado de un cashflow.
10. Filtrar por cuenta/categoría/estado.
11. Revisar calendario en escritorio.
12. Revisar calendario en móvil.
13. Refrescar la página y confirmar persistencia.
14. Cerrar sesión e intentar acceder a una ruta protegida.

---

## Build y despliegue

### Frontend

```bash
cd frontend
npm run build
```

El resultado se genera en `frontend/dist`.

Para Netlify, configurar:

```text
Build command: npm run build
Publish directory: dist
```

Variable de entorno en Netlify:

```env
VITE_API_URL=https://tu-backend-produccion.com/api
```

### Backend

```bash
cd backend
npm start
```

Variables necesarias en producción:

```env
PORT=3000
MONGO_URI=mongodb+srv://...
JWT_SECRET=valor_largo_y_seguro
JWT_EXPIRES_IN=7d
CORS_ORIGINS=https://tu-frontend-produccion.com
```

---

## Solución de problemas

### Error CORS

Síntoma:

```text
Not allowed by CORS
```

Solución:

```env
CORS_ORIGINS=http://localhost:5173
```

En producción, incluir el dominio real del frontend.

### Error de registro a localhost:5173

Síntoma:

```text
POST http://localhost:5173/auth/register 404
```

Solución:

```env
VITE_API_URL=http://localhost:3000/api
```

El archivo debe estar en:

```text
frontend/.env.local
```

Después hay que reiniciar Vite.

### Error de MongoDB Atlas con SRV

Si aparece un error tipo `querySrv ECONNREFUSED`, usar una cadena estándar `mongodb://...` con los hosts del cluster o revisar DNS/red.

### Cashflows sin cuenta

Comprobar:

1. `cashflows.csv` usa `accountAlias`.
2. `accounts.csv` tiene un `alias` coincidente.
3. `Cashflow.account` tiene `ref: 'Account'`.
4. El endpoint hace `populate('account')`.
5. El frontend muestra `account.alias`, `account.bank` o `account.nummber`.

### Status inválido

El modelo actual acepta:

```text
pending
paid
cancelled
```

No usar:

```text
planned
unpaid
```

si no están definidos en el enum del modelo.

---

## Calidad y seguridad

- Contraseñas guardadas con hash bcrypt.
- JWT para proteger endpoints.
- Middleware de autenticación.
- CORS restringido por origen.
- Helmet activo.
- Rate limit básico.
- Variables sensibles fuera del repositorio.
- Notificaciones propias en frontend, sin `alert()`.

---

## Mejoras futuras

- Añadir tests de integración para auth y cashflows.
- Añadir Swagger/OpenAPI.
- Añadir paginación en listados largos.
- Añadir auditoría de cambios por usuario.
- Añadir refresh tokens.
- Mejorar importación masiva de movimientos.
- Añadir dashboard financiero más avanzado.

---

## Defensa académica

Puntos clave para explicar el proyecto:

1. Es una arquitectura fullstack real.
2. El frontend y backend están separados.
3. La autenticación no está simulada.
4. Los datos persisten en MongoDB.
5. Los cashflows se asocian a cuentas reales.
6. El calendario y los reportes consumen datos de la API.
7. Las rutas protegidas requieren token JWT.
8. El proyecto usa variables de entorno y medidas básicas de seguridad.
