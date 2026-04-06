# AWPREVISION_TESORERIA · Backend

API para la **previsión de tesorería**: autenticación JWT, calendario de vencimientos, cuentas, categorías y actualización de estados de cashflows. Pensada para trabajar con el frontend de este repositorio.

---

## Tabla de contenidos

- [Stack](#stack)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Ejecución](#ejecución)
- [Scripts](#scripts)
- [Arquitectura](#arquitectura)
- [Modelo de datos](#modelo-de-datos)
- [Endpoints](#endpoints)
- [Autenticación](#autenticación)
- [Convenciones de respuesta](#convenciones-de-respuesta)
- [Seed de datos](#seed-de-datos)
- [Tests](#tests)
- [Docker](#docker)
- [Despliegue](#despliegue)
- [Solución de problemas](#solución-de-problemas)
- [Licencia](#licencia)

---

## Stack

- **Node.js** 18/20
- **Express**
- **PostgreSQL** (compatible **Neon**)  
- **Prisma ORM** (o Knex, según configuración de tu proyecto)
- **JWT** para autenticación
- **bcrypt** para hash de contraseñas
- **zod**/Joi para validación (opcional)

> Si tu backend usa otra pila, adapta las instrucciones manteniendo contratos de API y variables de entorno.

---

## Requisitos

- Node.js 18.x o 20.x
- PostgreSQL 14+ (o cuenta en **Neon**)
- npm 8+

---

## Instalación

```bash
git clone https://github.com/puentesAmed/AWPREVISION_TESORERIA.git
cd AWPREVISION_TESORERIA/backend

npm install


---

## Estructura

backend/
├─ data/ # CSV de carga
│ ├─ bankAccounts.csv
│ ├─ cashflows.csv
│ ├─ categories.csv
│ ├─ counterparties.csv
│ └─ users.csv
├─ scripts/
│ ├─ backfill-account-colors.js
│ ├─ seed.js
│ ├─ seedCashflows.js
│ ├─ seedCategories.js
│ └─ users.seed.js
└─ src/
├─ config/
│ ├─ env.js
│ └─ mongo.js
├─ controllers/
│ ├─ accounts.controller.js
│ ├─ auth.controller.js
│ ├─ cashflows.controller.js
│ ├─ categories.controller.js
│ ├─ counterparties.controller.js
│ ├─ dashboard.controller.js
│ ├─ forecast.controller.js
│ ├─ reports.controller.js
│ └─ scenarios.controller.js
├─ middleware/
│ └─ auth.js
├─ models/
│ ├─ Account.js
│ ├─ BankAccount.js
│ ├─ BankTx.js
│ ├─ Cashflow.js
│ ├─ Category.js
│ ├─ Counterparty.js
│ ├─ Scenario.js
│ └─ User.js
├─ routes/
│ ├─ accounts.routes.js
│ ├─ auth.routes.js
│ ├─ cashflows.routes.js
│ ├─ categories.routes.js
│ ├─ counterparties.routes.js
│ ├─ misc.routes.js
│ ├─ reports.routes.js
│ └─ scenarios.routes.js
├─ services/
│ └─ forecast.js
├─ app.js
└─ index.js


---

## Modelos

> Implementaciones en `src/models/*.js`.

- **User**
  - `email` (único), `password` (bcrypt), `name?`, `role` (`user|admin`), timestamps.
- **Account**
  - `alias`, `color?`, timestamps.
- **BankAccount**
  - Datos bancarios adicionales asociados a `Account` (si aplica: IBAN, entidad, color).
- **BankTx**
  - Movimientos bancarios importados; permite conciliación futura (`date`, `amount`, `concept`, `accountId`, `fitId?`).
- **Category**
  - `name`, opcional `parentId`, timestamps.
- **Counterparty**
  - `name`, metadatos opcionales (NIF, notas), timestamps.
- **Cashflow**
  - `date` (ISO), `amount` (Number), `type` (`in|out`),
  - `status` (`pending|paid|unpaid`), referencias `accountId`, `categoryId?`, `counterpartyId?`,
  - campos derivados/auxiliares para calendario (p. ej. `color`, `counterparty.name` embebido al importar).
- **Scenario**
  - Definición de escenarios de previsión (supuestos, ajustes, filtros) para simulaciones y reportes.

---

## Rutas (API)

Base: `/api`  
Autenticación: Bearer JWT salvo en `POST /auth/login`.

### Auth (`src/routes/auth.routes.js`)
- `POST /api/auth/login` → { user, token }
- `GET  /api/auth/me` (auth)

### Accounts (`src/routes/accounts.routes.js`)
- `GET    /api/accounts`
- `POST   /api/accounts` (admin)
- `PATCH  /api/accounts/:id`
- `DELETE /api/accounts/:id`

### Categories (`src/routes/categories.routes.js`)
- `GET    /api/categories`
- `POST   /api/categories`
- `PATCH  /api/categories/:id`
- `DELETE /api/categories/:id`

### Counterparties (`src/routes/counterparties.routes.js`)
- `GET    /api/counterparties`
- `POST   /api/counterparties`
- `PATCH  /api/counterparties/:id`
- `DELETE /api/counterparties/:id`

### Cashflows (`src/routes/cashflows.routes.js`)
- `GET    /api/cashflows?from&to&accountId&categoryId&status`
- `POST   /api/cashflows`
- `PATCH  /api/cashflows/:id`                 (editar campos)
- `PATCH  /api/cashflows/:id/status`          ({ status: 'pending|paid|unpaid' })
- `DELETE /api/cashflows/:id`

### Forecast / Calendar (`src/controllers/forecast.controller.js`)
- `GET /api/forecasts/calendar`  
  Devuelve cashflows preparados para el calendario del frontend.

### Reports (`src/routes/reports.routes.js`)
- `GET /api/reports/summary?from&to`  
- `GET /api/reports/by-category?from&to&accountId`  
- `GET /api/reports/by-account?from&to`

### Scenarios (`src/routes/scenarios.routes.js`)
- CRUD de escenarios y ejecución de simulaciones.

### Misc (`src/routes/misc.routes.js`)
- Rutas utilitarias (salud, versión, etc.).

---

## Servicios

- `src/services/forecast.js`  
  Lógica de agregación para calendario/previsiones: normaliza cashflows, agrupa por fecha y cuenta, aplica filtros de rango y construye estructuras de respuesta eficientes para el frontend.

---

## Requisitos

- Node.js 18+ o 20+
- MongoDB 6+ local o Atlas
- npm 8+

---

## Instalación

```bash
cd backend
npm install


## Variables de entorno

Crear backend/.env:

PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/awprevision
JWT_SECRET=cambia_este_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173

## Ejecución
npm run dev   # desarrollo (nodemon si está configurado)
npm start     # producción


Servidor en http://localhost:4000.

## Carga de datos (seed)
node scripts/seed.js                 # orquestador
# o bien individuales:
node scripts/users.seed.js
node scripts/seedCategories.js
node scripts/seedCashflows.js
node scripts/backfill-account-colors.js


Los CSV están en backend/data/.

## Autenticación

JWT firmado con JWT_SECRET.

Enviar Authorization: Bearer <token> en las rutas protegidas.

Middleware en src/middleware/auth.js.

## Convenciones de respuesta

Éxito:

{ "data": { ... } }


o array/objeto directo cuando aplica.

Error:

{
  "error": {
    "message": "Detalle",
    "code": "BAD_REQUEST",
    "details": { "campo": "motivo" }
  }
}

## Despliegue

Definir variables de entorno (MONGO_URI, JWT_SECRET, CORS_ORIGIN, PORT).

Conectar a MongoDB Atlas.

npm start como comando de arranque.

Solución de problemas

401: token ausente o inválido; revisar JWT_SECRET y expiración.

Totales en 0 en móvil: confirmar que amount es Number y que la ruta /forecasts/calendar devuelve datos por cuenta/fecha; el frontend suma localmente.

Overdue: el estado visual se calcula en el frontend a partir de status + fecha; el backend debe devolver status persistido.

CORS: alinear CORS_ORIGIN con la URL del frontend.