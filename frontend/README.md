# Frontend — Previsión de Tesorería

Frontend React/Vite para una aplicación interna de previsión de tesorería empresarial. Los usuarios comparten la misma información financiera corporativa; los roles controlan acciones y navegación administrativa.

## Stack

- React
- Vite
- Chakra UI
- React Router
- React Hook Form
- Zod
- Zustand
- Axios
- TanStack Query
- FullCalendar
- Recharts
- jsPDF / jspdf-autotable
- ExcelJS

## Variables

Crear `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:3000/api
```

En producción, `VITE_API_URL` debe apuntar al backend desplegado.

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Arranca Vite. |
| `npm run build` | Compila para producción. |
| `npm run preview` | Sirve el build local. |
| `npm run lint` | Ejecuta ESLint. |

## Estructura

```text
src/
  api/       clientes de API por dominio
  lib/       Axios centralizado y utilidades
  state/     auth y notificaciones locales
  ui/
    components/
    layouts/
    pages/
```

## Rutas

| Ruta | Roles | Descripción |
| --- | --- | --- |
| `/login` | Público | Inicio de sesión. |
| `/register` | Público | Registro con nombre, email y contraseña. |
| `/dashboard` | admin, fin, viewer | KPIs y gráficos financieros. |
| `/calendar` | admin, fin, viewer | Calendario de vencimientos, cobros y pagos previstos. |
| `/totals` | admin, fin, viewer | Resumen financiero y PDFs. |
| `/profile` | admin, fin, viewer | Mi cuenta: nombre y contraseña. |
| `/accounts` | admin | Gestión de cuentas. |
| `/import` | admin | Importación Excel/CSV. |
| `/settings` | admin | Configuración y acciones administrativas. |

## Funcionalidades

- Dashboard con filtros por fecha, mes, año, cuenta, categoría y estado.
- Distribución calculada sobre ingresos del periodo: gastos y disponible.
- Calendario con leyenda de cuentas y estado visual derivado.
- Resumen financiero con PDF de vencidos y pendientes por cuenta/mes.
- Importación principal mediante plantilla Excel `.xlsx`.
- CSV como compatibilidad secundaria.
- Notificaciones locales aisladas por usuario.
- Perfil de usuario sin cambio de rol.

## Importación

La plantilla Excel se genera desde la página de importación e incluye:

```text
Hoja Cashflows
Hoja Instrucciones
Ejemplos
Validación type: in | out
Validación status: pending | paid | cancelled
```

Columnas esperadas:

```text
accountAlias, categoryName, counterpartyNif, date, amount, type, concept, status
```

Tras importar se muestra:

```text
totalRows, inserted, skipped, errors
```

Si no se importa ningún registro, la UI explica si fue por errores, duplicados/omitidos o ausencia de filas válidas.

## Estados

Estados persistidos:

```text
pending, paid, cancelled
```

`Vencido` es visual: fecha pasada + `pending`.
