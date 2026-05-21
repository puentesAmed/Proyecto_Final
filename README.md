# Proyecto Final Fullstack - Previsión de Tesorería

Aplicación fullstack para gestionar ingresos, gastos y previsión de tesorería con autenticación real, API REST y persistencia en MongoDB.

## Arquitectura
- **Frontend:** React + Vite + Chakra UI (`frontend/`).
- **Backend/API:** Node.js + Express + Mongoose (`backend/`).
- **Base de datos:** MongoDB.

## Funcionalidades principales
- Registro y login real con JWT.
- Rutas privadas protegidas en frontend y backend.
- CRUD de movimientos (cashflows) persistidos en DB.
- Dashboard con filtros por cuenta, categoría y periodo.
- Notificaciones internas en UI (sin `alert()`).

## Instalación
1. Instalar dependencias en la raíz:
   ```bash
   npm install
   ```
2. Copiar variables de entorno:
   - Crear `backend/.env` desde `.env.example`.
   - Crear `frontend/.env.local` con `VITE_API_URL`.
3. Levantar MongoDB local o remoto.

## Ejecución
- **Todo el proyecto (frontend + backend):**
  ```bash
  npm run dev
  ```
- **Solo backend:**
  ```bash
  npm run dev -w backend
  ```
- **Solo frontend:**
  ```bash
  npm run dev -w frontend
  ```

## Datos de ejemplo (seed)
```bash
npm run seed
```

## Endpoints base
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/cashflows`
- `POST /api/cashflows`
- `PUT /api/cashflows/:id`
- `DELETE /api/cashflows/:id`

## Seguridad aplicada
- Contraseñas hasheadas con bcrypt.
- Tokens JWT con expiración.
- Middleware de autenticación en endpoints privados.
- CORS configurado por variables de entorno.

## Mejoras aplicadas en esta revisión
- Se consolidó el middleware de autenticación del backend.
- Se protegieron rutas de cashflows con JWT.
- Se forzó aislamiento por usuario en listados y operaciones CRUD de movimientos.
- Se mejoró SEO básico en `frontend/index.html`.
- Se añadieron `.env.example` y documentación raíz del proyecto.
