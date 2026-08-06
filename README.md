# Acreedores MDM — Backend API

API REST construida con **Express.js** y **Prisma ORM** para la gestión de Datos Maestros (MDM) de Acreedores, Proveedores, Clientes y Materiales.

## Requisitos previos

- **Node.js** >= 18
- **npm** >= 9
- **PostgreSQL** >= 14

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/FranOrantes/acreedores_mdm.git
cd acreedores_mdm

# 2. Instalar dependencias
npm install
```

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# ── Base de datos ──
DATABASE_URL="postgresql://usuario:password@localhost:5432/acreedores_mdm"

# ── Servidor ──
PORT=3001
FRONTEND_URL=http://localhost:5173

# ── JWT ──
JWT_SECRET=tu_secreto_jwt_seguro

# ── SSO (OAuth2) — Opcional, desactivado por defecto ──
SSO_CLIENT_ID=
SSO_CLIENT_SECRET=
SSO_AUTHORIZATION_URL=
SSO_TOKEN_URL=
SSO_USERINFO_URL=
SSO_CALLBACK_URL=

# ── ServiceNow (módulo Clientes) ──
SERVICENOW_BASE_URL=https://tu-instancia.service-now.com
SERVICENOW_USER=
SERVICENOW_PASSWORD=

# ── n8n Webhooks ──
N8N_WEBHOOK_ACR_SOLICITUD_CREADA=https://tu-n8n.com/webhook/...
N8N_WEBHOOK_ACR_APROBACION_APROBADA=https://tu-n8n.com/webhook/...
N8N_WEBHOOK_ACR_APROBACION_RECHAZADA=https://tu-n8n.com/webhook/...
N8N_WEBHOOK_PROV_SOLICITUD_CREADA=https://tu-n8n.com/webhook/...
N8N_WEBHOOK_PROV_APROBACION_APROBADA=https://tu-n8n.com/webhook/...
N8N_WEBHOOK_PROV_APROBACION_RECHAZADA=https://tu-n8n.com/webhook/...

# ── Push Notifications (VAPID) — Opcional ──
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:admin@tudominio.com

# ── Logs / n8n webhook secret ──
LOGS_WEBHOOK_SECRET=

# ── OCR (Concordia) — Opcional ──
OCR_API_URL=https://concordia.nadro.dev/api/extract_pdf
OCR_API_KEY=

# ── COPOMEX (códigos postales) — Opcional ──
COPOMEX_TOKEN=
```

> **Mínimo requerido**: `DATABASE_URL`, `JWT_SECRET` y `FRONTEND_URL`.

## Base de datos

```bash
# 1. Generar el cliente Prisma
npx prisma generate

# 2. Aplicar migraciones
npx prisma migrate deploy

# 3. Poblar catálogos iniciales (sucursales, tipos de acreedor, etc.)
npx prisma db seed
```

## Ejecución

```bash
# Desarrollo (hot-reload con nodemon)
npm run dev

# Producción
npm start
```

El servidor inicia en `http://localhost:3001` por defecto.

## Verificar que funciona

```bash
curl http://localhost:3001/api/health
# → {"status":"ok","timestamp":"..."}
```

## Estructura del proyecto

```
src/
├── index.js               # Entry point, registro de rutas
├── lib/
│   ├── prisma.js           # Instancia Prisma
│   ├── n8n.js              # Webhooks a n8n
│   ├── pushNotifications.js
│   └── logger.js
├── middleware/
│   ├── auth.js             # SSO / JWT
│   └── domainScope.js      # Multi-tenant por dominio
└── routes/
    ├── auth.js             # Login SSO
    ├── solicitudes.js      # CRUD solicitudes
    ├── tareasSolicitud.js  # Timeline de tareas (n8n)
    ├── aprobaciones.js     # Flujo de aprobación
    ├── documentos.js       # Gestión documental
    ├── catalogos.js        # Catálogos base
    ├── dashboard.js        # KPIs y métricas
    ├── clientes/           # Módulo Clientes (proxy ServiceNow)
    │   ├── tareas.js
    │   ├── servicenow.js
    │   └── attachments.js
    └── materiales/         # Módulo Materiales (placeholder)
        └── index.js
prisma/
├── schema.prisma          # Modelos de datos
├── migrations/            # Migraciones SQL
├── seed.js                # Datos iniciales
└── seedAdmin.js           # Seed de admin
```

## Módulos

| Módulo | Descripción | Fuente de datos |
|--------|-------------|-----------------|
| **Acreedores** | Alta y gestión de acreedores | Base de datos local (Prisma) |
| **Proveedores** | Alta y gestión de proveedores | Base de datos local (Prisma) |
| **Clientes** | Tareas de verificación sanitaria | ServiceNow (proxy) |
| **Materiales** | Placeholder | — |

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia en modo desarrollo con hot-reload |
| `npm start` | Inicia en modo producción |
| `npm run prisma:generate` | Regenera el cliente Prisma |
| `npm run prisma:migrate` | Crea nueva migración (desarrollo) |
| `npm run prisma:seed` | Ejecuta el seed de catálogos |
| `npm run prisma:reset` | Reset completo de la base de datos |