# Previsión de Tesorería

Aplicación fullstack para la previsión de tesorería de una empresa. Es una herramienta interna: los usuarios trabajan sobre la misma previsión financiera corporativa y los roles controlan permisos de acción, no la visibilidad completa de los datos.

## Deploy

| Servicio | URL |
| --- | --- |
| Frontend desplegado | Pendiente de publicar/configurar |
| Backend desplegado | Pendiente de publicar/configurar |

## Credenciales demo

| Rol | Email | Contraseña |
| --- | --- | --- |
| admin | `admin@demo.com` | `Admin123!` |
| fin | `fin@demo.com` | `Admin123!` |
| viewer | `viewer@demo.com` | `Admin123!` |

## Roles

| Rol | Permisos |
| --- | --- |
| admin | Ve todo y gestiona cuentas, importación, configuración y borrado masivo. |
| fin | Ve dashboard, calendario y resumen financiero; puede gestionar vencimientos operativos. |
| viewer | Ve dashboard, calendario y resumen financiero; no modifica datos críticos. |

## Arquitectura

```text
frontend React/Vite -> API REST Express -> MongoDB
```

## Estructura

```text
frontend/
  src/
    api/
    lib/
    state/
    ui/
backend/
  data/
  scripts/
  src/
    controllers/
    middleware/
    models/
    routes/
```

## Variables principales

Frontend:

```env
VITE_API_URL=http://localhost:3000/api
```

Backend:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/prevision-tesoreria
JWT_SECRET=cambia_este_secret_por_un_valor_largo
CORS_ORIGINS=http://localhost:5173
```

`VITE_API_URL` debe apuntar al backend. `CORS_ORIGINS` debe incluir el dominio del frontend.

## Comandos

| Contexto | Comando | Uso |
| --- | --- | --- |
| raíz | `npm install` | Instalar workspaces. |
| raíz | `npm run dev` | Arrancar frontend y backend en desarrollo. |
| frontend | `npm run build` | Compilar frontend. |
| backend | `npm run seed` | Crear datos demo principales. |
| backend | `npm start` | Arrancar API. |

## Funcionalidades

- Autenticación con JWT.
- Registro con `name`, `email` y `password`; el rol por defecto es `fin`.
- Dashboard con filtros compartidos y gráficos de ingresos, gastos, balance, distribución y balance por cuenta.
- Calendario de vencimientos, cobros y pagos previstos.
- Resumen financiero y descargas PDF.
- Gestión de cuentas solo para admin.
- Importación principal mediante plantilla Excel `.xlsx`; CSV se mantiene como compatibilidad.
- Notificaciones locales aisladas por usuario y limpiadas al cambiar/cerrar sesión.

## Modelos principales

```text
User: name, email, passwordHash, role
Account: alias, aliasNormalized, bank, number, color, currency, initialBalance
Cashflow: user, date, account, counterparty, amount, type, category, concept, status
Category: name, kind
Counterparty: name, contact, nif, kind
Scenario: name, description, assumptions
```

Estados persistidos válidos:

```text
pending, paid, cancelled
```

`overdue`/`vencido` no se guarda en MongoDB: se calcula cuando un cashflow está `pending` y su fecha ya pasó.

## Endpoints principales

| Método | Endpoint | Descripción |
| --- | --- | --- |
| POST | `/api/auth/register` | Registro de usuario. |
| POST | `/api/auth/login` | Login. |
| GET | `/api/auth/me` | Perfil del usuario autenticado. |
| PATCH | `/api/auth/me` | Actualizar nombre del usuario. |
| PATCH | `/api/auth/password` | Cambiar contraseña. |
| GET | `/api/cashflows` | Listado compartido de cashflows. |
| GET | `/api/cashflows/calendar` | Eventos del calendario. |
| POST | `/api/cashflows` | Crear cashflow, admin/fin. |
| PATCH | `/api/cashflows/:id/status` | Cambiar estado, admin/fin. |
| POST | `/api/cashflows/import` | Importación Excel/CSV, admin. |
| GET | `/api/accounts` | Listar cuentas. |
| POST | `/api/accounts` | Crear cuenta, admin. |
| GET | `/api/reports/totals` | Totales por periodo. |
| GET | `/api/reports/overdue` | Vencidos. |
| GET | `/api/reports/pending-per-account-month` | Pendientes por cuenta y mes. |

## Documentación específica

- [Frontend](frontend/README.md)
- [Backend](backend/README.md)
