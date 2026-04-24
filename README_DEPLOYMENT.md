# RPtools - Deployment Guide

## Descripción

**RPtools** es una SaaS de panel de control para distribuidores de Royale Prestige que extrae datos en tiempo real del backoffice de HyCite mediante scraping autenticado.

## Arquitectura

- **Frontend:** React 19 + Tailwind CSS 4
- **Backend:** Express 4 + tRPC 11
- **Base de Datos:** PostgreSQL (Supabase)
- **Hosting:** Vercel
- **Autenticación:** Manus OAuth

## Despliegue en Vercel

### Paso 1: Conectar GitHub a Vercel

1. Ve a https://vercel.com
2. Haz clic en **New Project**
3. Selecciona **Import Git Repository**
4. Busca `jfadministracion/rptools`
5. Haz clic en **Import**

### Paso 2: Configurar Variables de Entorno

En Vercel, ve a **Settings → Environment Variables** y agrega:

```
DATABASE_URL=postgresql://postgres:PASSWORD@PROJECT_ID.supabase.co:5432/postgres
JWT_SECRET=your_jwt_secret
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
OWNER_OPEN_ID=your_owner_open_id
OWNER_NAME=Your Name
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your_frontend_api_key
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your_website_id
VITE_APP_TITLE=RPtools
VITE_APP_LOGO=https://your-logo-url.com/logo.png
```

### Paso 3: Desplegar

1. Haz clic en **Deploy**
2. Vercel construirá y desplegará automáticamente
3. Una vez completado, verás la URL de tu aplicación

## Desarrollo Local

### Instalación

```bash
cd rptools
pnpm install
```

### Variables de Entorno

Copia `.env.example` a `.env.local` y actualiza con tus valores:

```bash
cp .env.example .env.local
```

### Ejecutar en Desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

### Build para Producción

```bash
pnpm build
pnpm start
```

## Estructura del Proyecto

```
rptools/
├── client/              # Frontend React
│   ├── src/
│   │   ├── pages/      # Páginas principales
│   │   ├── components/ # Componentes reutilizables
│   │   ├── lib/        # Utilidades
│   │   └── App.tsx     # Punto de entrada
│   └── index.html
├── server/             # Backend Express + tRPC
│   ├── routers.ts      # Procedimientos tRPC
│   ├── db.ts           # Helpers de base de datos
│   └── _core/          # Configuración interna
├── drizzle/            # Esquema y migraciones
│   └── schema.ts       # Definición de tablas
├── shared/             # Código compartido
└── vercel.json         # Configuración de Vercel
```

## Base de Datos

### Tablas Principales

- **users** - Usuarios del sistema
- **distributors** - Cuentas de distribuidores
- **team_members** - Colaboradores
- **hycite_connections** - Conexiones con HyCite
- **data_snapshots** - Datos extraídos
- **sync_logs** - Historial de sincronizaciones
- **google_sheets_config** - Configuración de Google Sheets

### Migraciones

Las migraciones se ejecutan automáticamente en el primer despliegue. Si necesitas ejecutarlas manualmente:

```bash
pnpm drizzle-kit migrate
```

## Funcionalidades Principales

### 1. Autenticación con Roles
- Distribuidor (dueño): acceso total
- Administrador de Cuentas: acceso limitado

### 2. Conexión a HyCite
- Modo manual: ingresa OTP cada vez
- Modo automático: reconexión automática

### 3. Dashboard
- Visualización de datos en tiempo real
- Métricas de ventas, pedidos, etc.
- Estado de conexión con HyCite

### 4. Exportación de Datos
- Exportar a CSV/Excel
- Sincronizar con Google Sheets

## Troubleshooting

### Error: "DATABASE_URL is required"
Asegúrate de que la variable de entorno `DATABASE_URL` está configurada en Vercel.

### Error: "Connection refused"
Verifica que la URL de Supabase es correcta y que el firewall permite conexiones desde Vercel.

### Error: "OAuth callback failed"
Asegúrate de que `OAUTH_SERVER_URL` y `VITE_OAUTH_PORTAL_URL` están configuradas correctamente.

## Soporte

Para reportar problemas o solicitar nuevas funcionalidades, abre un issue en GitHub.

## Licencia

Proprietary - Royale Prestige
