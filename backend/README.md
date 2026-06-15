# Backend — Previsión de Tesorería

API REST en Node.js/Express para una herramienta interna de previsión de tesorería empresarial. Los cashflows son datos corporativos compartidos; `Cashflow.user` se conserva como creador/auditoría.

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
- Multer
- csv-parse
- xlsx

## Variables de entorno

Crear `backend/.env`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/prevision-tesoreria
JWT_SECRET=cambia_este_secret_por_un_valor_largo
CORS_ORIGINS=https://proyectofinalpuentes.netlify.app
```

`CORS_ORIGINS` acepta varios orígenes separados por coma.

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Arranca API con nodemon. |
| `npm start` | Arranca API con Node. |
| `npm run seed` | Crea usuarios demo, cuentas, categorías, contrapartes y cashflows. |
| `npm run seed:categories` | Reinicia solo categorías. |
| `npm run seed:cashflows` | Seed auxiliar histórico; usar preferentemente `npm run seed`. |

## Credenciales demo

| Rol | Email | Contraseña |
| --- | --- | --- |
| admin | `admin@demo.com` | `Admin123!` |
| fin | `fin@demo.com` | `Admin123!` |
| viewer | `viewer@demo.com` | `Admin123!` |

## Modelos

```text
User {
  name: String
  email: String
  passwordHash: String
  role: 'admin' | 'fin' | 'viewer'
}
```

```text
Account {
  alias: String
  aliasNormalized: String
  bank: String
  number: String
  color: String
  currency: 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CHF'
  initialBalance: Number
}
```

```text
Cashflow {
  user: ObjectId<User>
  date: Date
  account: ObjectId<Account>
  counterparty: ObjectId<Counterparty>
  amount: Number
  type: 'in' | 'out'
  category: ObjectId<Category>
  concept: String
  status: 'pending' | 'paid' | 'cancelled'
}
```

```text
Category {
  name: String
  kind: 'operating' | 'financing' | 'investing'
}
```

```text
Counterparty {
  name: String
  contact: String
  nif: String
  kind: 'client' | 'supplier' | 'bank'
}
```

## Endpoints

### Auth

| Método | Endpoint | Permiso | Descripción |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Público | Registro con `name`, `email`, `password`; crea rol `fin`. |
| POST | `/api/auth/login` | Público | Login. |
| GET | `/api/auth/me` | Autenticado | Perfil propio. |
| PATCH | `/api/auth/me` | Autenticado | Actualiza nombre propio. |
| PATCH | `/api/auth/password` | Autenticado | Cambia contraseña propia. |

### Accounts

| Método | Endpoint | Permiso | Descripción |
| --- | --- | --- | --- |
| GET | `/api/accounts` | Autenticado | Lista cuentas. |
| GET | `/api/accounts/balance` | Autenticado | Balance por cuenta. |
| POST | `/api/accounts` | admin | Crea cuenta y valida alias único. |
| PATCH | `/api/accounts/:id` | admin | Edita cuenta y valida alias único. |
| DELETE | `/api/accounts/:id` | admin | Elimina cuenta. |

### Cashflows

| Método | Endpoint | Permiso | Descripción |
| --- | --- | --- | --- |
| GET | `/api/cashflows` | Autenticado | Lee cashflows corporativos compartidos. |
| GET | `/api/cashflows/calendar` | Autenticado | Eventos para calendario. |
| GET | `/api/cashflows/upcoming` | Autenticado | Próximos vencimientos. |
| GET | `/api/cashflows/monthly` | Autenticado | Evolución mensual. |
| POST | `/api/cashflows` | admin, fin | Crea cashflow. |
| PUT | `/api/cashflows/:id` | admin, fin | Edita cashflow. |
| PATCH | `/api/cashflows/:id/status` | admin, fin | Cambia estado persistido. |
| DELETE | `/api/cashflows/:id` | admin | Elimina cashflow. |
| DELETE | `/api/cashflows/all` | admin | Borrado masivo. |
| POST | `/api/cashflows/import` | admin | Importa Excel/CSV. |

### Reports

| Método | Endpoint | Permiso | Descripción |
| --- | --- | --- | --- |
| GET | `/api/reports/totals` | Autenticado | Totales por periodo. |
| GET | `/api/reports/overdue` | Autenticado | Vencimientos vencidos. |
| GET | `/api/reports/pending-per-account-month` | Autenticado | Pendientes por cuenta y mes. |

## Importación

Formato principal: Excel `.xlsx`/`.xls`. Compatibilidad secundaria: `.csv`.

La primera hoja del Excel debe contener:

```text
accountAlias, categoryName, counterpartyNif, date, amount, type, concept, status
```

Validaciones:

```text
date válida
amount numérico
type: in | out
status: pending | paid | cancelled
accountAlias existente
```

Respuesta:

```text
totalRows, inserted, skipped, errors
```

## Seed

`npm run seed` usa `backend/data/*.csv` y crea:

- usuarios demo `admin`, `fin`, `viewer`
- accounts
- categories
- counterparties
- cashflows con `account` referenciando `Account`

Los estados persistidos válidos son `pending`, `paid`, `cancelled`. El estado visual `overdue` se calcula, no se guarda.
