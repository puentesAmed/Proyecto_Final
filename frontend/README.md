# AWPREVISION_TESORERIA

Aplicación web para **previsión de tesorería** con calendario de vencimientos, totales por día, filtros por cuenta/categoría/estado y diseño adaptado para **móvil** y **escritorio**.

---

## Tabla de contenidos

- [Tecnologías](#tecnologías)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Ejecución](#ejecución)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Características](#características)
- [Implementación clave](#implementación-clave)
  - [Calendario y vistas responsive](#calendario-y-vistas-responsive)
  - [Totales por día](#totales-por-día)
  - [Cambio de estado en eventos](#cambio-de-estado-en-eventos)
  - [Tema y estilos (Chakra + FullCalendar)](#tema-y-estilos-chakra--fullcalendar)
  - [Login con mostrar/ocultar contraseña](#login-con-mostrarocultar-contraseña)
- [Servicios / API](#servicios--api)
- [Comandos útiles](#comandos-útiles)
- [Despliegue en Netlify](#despliegue-en-netlify)
- [Git: flujos frecuentes](#git-flujos-frecuentes)
- [Solución de problemas](#solución-de-problemas)
- [Licencia](#licencia)

---

## Tecnologías

- React + Vite
- Chakra UI (tema personalizado, dark/light)
- FullCalendar (`@fullcalendar/react`, `@fullcalendar/daygrid`, `@fullcalendar/list`, `@fullcalendar/interaction`)
- TanStack React Query
- react-hook-form + zod
- Axios
- Netlify (deploy)

---

## Requisitos

- Node.js 18.x o 20.x
- npm 8+

---

## Instalación

```bash
# Clona el repo
git clone https://github.com/puentesAmed/AWPREVISION_TESORERIA.git
cd AWPREVISION_TESORERIA/frontend

# Instala dependencias
npm install

---

## Variables de entorno

Crea frontend/.env con:

VITE_API_URL=https://awprevision-tesoreria.onrender.com/api

---

## Ejecución

# Desarrollo con HMR
npm run dev

# Build producción
npm run build

# Previsualizar el build
npm run preview

---

## Estructura del proyecto
frontend/
├─ main.jsx
├─ index.html
├─ vite.config.js
├─ package.json
├─ package-lock.json
├─ .env
├─ .env.production
├─ .gitignore
├─ eslint.config.js
├─ netlify.toml
├─ router.jsx
├─ public/
│  └─ favicon.svg
└─ src/
   ├─ api/
   │  ├─ accountsService.js
   │  ├─ authService.js
   │  ├─ cashflowsService.js
   │  ├─ dashboardService.js
   │  ├─ forecastsService.js
   │  ├─ login.js
   │  └─ reportsService.js
   ├─ context/
   │  └─ UserContext.jsx
   ├─ hooks/
   │  ├─ useDebounce.js
   │  └─ useUrlState.js
   ├─ lib/
   │  ├─ api.js
   │  └─ utils.js
   ├─ state/
   │  └─ auth.js
   ├─ styles/
   │  ├─ App.css
   │  └─ style.css
   └─ ui/
      ├─ components/
      │  ├─ DataTable.jsx
      │  ├─ ForecastChart.jsx
      │  ├─ FormComponents.jsx
      │  ├─ KpiCard.jsx
      │  └─ NewForecastModal.jsx
      ├─ layouts/
      │  └─ AppLayout.jsx
      ├─ pages/
      │  ├─ AccountsPage.jsx
      │  ├─ CalendarPage.jsx
      │  ├─ DashboardPage.jsx
      │  ├─ ImportPage.jsx
      │  ├─ LoginPage.jsx
      │  ├─ SettingsPage.jsx
      │  └─ TotalsPage.jsx
      ├─ App.jsx
      ├─ ProtectedLayout.jsx
      ├─ RequireAuth.jsx
      └─ theme.js

---

## Características

#Calendario de vencimientos

Escritorio: dayGridMonth con totales por día en cada celda.

Móvil: listMonth, cada día se muestra como tarjeta, sin desbordes.

Agrupación por cuenta y colores coherentes con la leyenda.

Cambio de estado: pending, overdue, unpaid, paid.

Eliminar vencimientos con confirmación.

# Filtros por cuenta, categoría, mes, año y estado (usa estado visual derivado).

# Totales por día

Cálculo robusto y sincronizado con filtros.

Modo suma con signo o valor absoluto (configurable).

# Autenticación

Login validado con zod.

Mostrar/ocultar contraseña en el input.

# Tema y estilos

Paleta personalizada (brand/accent/neutral).

Overrides para FullCalendar (grid + list).

Componentes Chakra con estilos por defecto.

---

## Implementación clave

Calendario y vistas responsive

// Detección móvil
const isMobile = useBreakpointValue({ base: true, md: false });

// FullCalendar
<FullCalendar
  key={`cal-${isMobile ? 'm' : 'd'}-${calKey}`}
  plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
  initialView={isMobile ? "listMonth" : "dayGridMonth"}
  locale={esLocale}
  titleFormat={isMobile ? { month: "short", year: "numeric" } : { month: "long", year: "numeric" }}
  dayHeaderFormat={isMobile ? { weekday: "short" } : { weekday: "long" }}
  listDayFormat={{ weekday: "long", day: "numeric" }}
  listDaySideFormat={false}
  expandRows={!isMobile}
  dayMaxEventRows={isMobile ? false : 3}
  dayMaxEvents={isMobile ? false : true}
  height="auto"
/>

# Render condicional de eventos:

eventContent={(arg) =>
  arg.view.type.startsWith('list')
    ? renderEventContentList(arg)   // tarjeta por día en móvil
    : renderEventContent(arg)       // grid en escritorio
}

---

## Totales por día

dayTotals: Map<YYYY-MM-DD, number> recalculado en useEffect([allEvents, filters]).

Escritorio: se inyectan con dayCellDidMount (fecha local con toLocalYMD).

Móvil: en agrupados se usa extendedProps.sum.

# Si ves 0 en tarjetas agrupadas:

Verifica que projectForCalendar() ponga extendedProps.sum en los eventos group: true.

En la vista lista, usa xp.sum para mostrar el total del grupo.

# Cambio de estado en eventos

Menú desplegable dentro del evento con e.stopPropagation() para no disparar eventClick.

Actualización optimista en memoria y llamada a API:

await setCashflowStatus(id, next); // si falla → loadAll()

# Estado visual derivado con:

computeUiStatus(persistedStatus, ymd)
// pending con fecha pasada → overdue

---

## Tema y estilos (Chakra + FullCalendar)

#src/theme/theme.js:

Paletas: brand (verde oliva), accent (cyan petróleo), neutral (grises).

Overrides FullCalendar (grid/list): tipografías, bordes, “hoy”, eventos, tarjetas de lista.

Componentes Chakra (Button/Input/Select/Textarea/Table) con estilos base y focos accesibles.

# Solución a texto de input poco visible en modo light:

Inputs Chakra ya heredan colores correctos del tema.

En LoginPage se usan componentes Chakra (FormControl, Input, etc.).

## Login con mostrar/ocultar contraseña

# LoginPage.jsx usa:

InputGroup + InputRightElement con un botón para alternar type=password/text.

Validación con zod.

En onSubmit, guarda user y token y redirige a /dashboard.

---

## Servicios / API

# src/lib/api.js

Cliente Axios con baseURL = VITE_API_URL, interceptores si procede.

# src/api/forecastsService.js

getCalendar(params?)
Devuelve eventos ya normalizados (id, start YYYY-MM-DD, _accountId, _amount, _status, _ui, extendedProps.*).

# src/api/cashflowsService.js

setCashflowStatus(id, nextStatus)
Actualiza estado persistido; el estado visual se deriva en cliente.

# src/api/accountsService.js

getAccounts()
Para la leyenda de cuentas (alias, color, id).

Ajusta endpoints a tu backend si varían.

---

## Comandos útiles

#Instalar dependencias clave:

npm i @chakra-ui/react @emotion/react @emotion/styled framer-motion
npm i @fullcalendar/react @fullcalendar/daygrid @fullcalendar/interaction @fullcalendar/list
npm i @tanstack/react-query
npm i react-hook-form zod @hookform/resolvers
npm i axios
