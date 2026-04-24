# RPtools - TODO List

## Fase 1: Arquitectura de Base de Datos y Modelo de Roles

### Base de Datos
- [x] Definir esquema de tablas: users, distributors, accounts, connections, sync_logs, data_snapshots
- [x] Crear tabla `users` con campos: id, openId, email, name, role (distribuidor/admin), createdAt, updatedAt
- [x] Crear tabla `distributors` con campos: id, userId, companyName, hyciteUsername, hyciteEmail, createdAt
- [x] Crear tabla `team_members` con campos: id, distributorId, userId, role (admin_cuentas), permissions, createdAt
- [x] Crear tabla `hycite_connections` con campos: id, distributorId, connectionMode (manual/automatic), sessionToken, lastConnected, status, createdAt
- [x] Crear tabla `data_snapshots` con campos: id, distributorId, dataType (ventas/pedidos/metricas), jsonData, extractedAt, createdAt
- [x] Crear tabla `sync_logs` con campos: id, distributorId, status (success/failed), errorMessage, syncedAt, createdAt
- [x] Crear tabla `google_sheets_config` con campos: id, distributorId, sheetUrl, accessToken, refreshToken, createdAt

### Migraciones
- [x] Generar migraciones SQL con drizzle-kit
- [x] Ejecutar migraciones en la base de datos

---

## Fase 2: Sistema de Autenticación con Roles

### Backend
- [x] Extender modelo de usuarios con campos: role, distributorId
- [x] Crear procedimiento `auth.me` para obtener usuario actual con su rol
- [x] Crear procedimiento `distributors.create` para que un usuario se registre como distribuidor
- [x] Crear procedimiento `team.addMember` para que un distribuidor agregue un administrador de cuentas
- [x] Crear procedimiento `team.listMembers` para listar colaboradores de un distribuidor
- [x] Implementar `protectedProcedure` con validación de rol

### Frontend
- [ ] Crear hook `useAuth()` que retorne usuario actual y su rol
- [ ] Crear componente `RoleGuard` para proteger rutas según rol
- [ ] Crear página de onboarding para distribuidores (registro inicial)
- [ ] Crear página de gestión de equipo (agregar/eliminar administradores)

---

## Fase 3: Módulo de Scraping Autenticado a HyCite

### Backend - Scraping Engine
- [x] Crear módulo `server/scraping/hyciteClient.ts` con clase HyCiteClient
- [x] Implementar login automático a HyCite con usuario + contraseña
- [x] Implementar manejo de OTP: captura de código del email y envío al formulario
- [x] Implementar extracción de datos de tablas HTML (ventas, pedidos, métricas)
- [x] Implementar manejo de sesiones persistentes (cookies, tokens)
- [x] Crear procedimiento `hycite.connectManual` para modo "conectar cada vez"
- [ ] Crear procedimiento `hycite.connectAutomatic` para modo "siempre conectado"
- [x] Crear procedimiento `hycite.disconnect` para cerrar sesión
- [x] Crear procedimiento `hycite.getConnectionStatus` para obtener estado actual

### Backend - Sincronización Periódica
- [ ] Crear job `syncHyCiteData` que se ejecute cada X minutos
- [ ] Implementar lógica de reintentos en caso de fallo
- [ ] Guardar snapshots de datos en tabla `data_snapshots`
- [ ] Registrar logs de sincronización en tabla `sync_logs`
- [ ] Notificar al distribuidor si la conexión falla o expira

### Frontend
- [ ] Crear página `HyCiteConnection` con formulario de login
- [ ] Implementar selector de modo de conexión (manual/automático)
- [ ] Mostrar indicador visual de estado de conexión (verde/rojo)
- [ ] Mostrar último tiempo de sincronización
- [ ] Implementar botón para reconectar manualmente

---

## Fase 4: Dashboard en Tiempo Real

### Backend
- [ ] Crear procedimiento `dashboard.getSalesData` (filtrado por rol)
- [ ] Crear procedimiento `dashboard.getOrdersData` (filtrado por rol)
- [ ] Crear procedimiento `dashboard.getMetrics` (filtrado por rol)
- [ ] Crear procedimiento `dashboard.getConnectionStatus`
- [ ] Implementar filtros por fecha, tipo de dato, etc.

### Frontend
- [ ] Crear layout principal con sidebar (DashboardLayout)
- [ ] Crear página `Dashboard` con widgets de métricas clave
- [ ] Crear tabla de ventas con datos en tiempo real
- [ ] Crear tabla de pedidos con datos en tiempo real
- [ ] Crear gráficos de tendencias (ventas, pedidos)
- [ ] Implementar filtros por fecha y tipo de dato
- [ ] Mostrar indicador de estado de conexión con HyCite
- [ ] Mostrar último tiempo de sincronización

---

## Fase 5: Exportación y Sincronización con Google Sheets

### Backend
- [ ] Crear procedimiento `export.generateCSV` para exportar datos a CSV
- [ ] Crear procedimiento `export.generateExcel` para exportar datos a Excel
- [ ] Crear procedimiento `googleSheets.authorize` para OAuth con Google
- [ ] Crear procedimiento `googleSheets.syncData` para enviar datos a Google Sheets
- [ ] Crear procedimiento `googleSheets.getConfig` para obtener configuración
- [ ] Crear procedimiento `googleSheets.updateConfig` para actualizar configuración

### Frontend
- [ ] Crear componente `ExportButton` con opciones CSV/Excel
- [ ] Crear página `GoogleSheetsConfig` para configurar sincronización
- [ ] Implementar flujo de autorización OAuth con Google
- [ ] Mostrar estado de sincronización con Google Sheets
- [ ] Crear botón para sincronizar manualmente

---

## Fase 6: Branding de Royale Prestige

### Diseño Visual
- [ ] Obtener colores corporativos de Royale Prestige
- [ ] Obtener logo oficial de Royale Prestige
- [ ] Definir paleta de colores en `client/src/index.css`
- [ ] Actualizar tipografía según branding
- [ ] Crear componentes de header/footer con branding

### Interfaz
- [ ] Aplicar colores corporativos a todos los componentes
- [ ] Reemplazar logo genérico por logo de Royale Prestige
- [ ] Aplicar estilos de branding a botones, cards, tablas
- [ ] Crear página de inicio (Home) con branding
- [ ] Pulir diseño de formularios y modales

---

## Fase 7: Pruebas Finales y Entrega

### Testing
- [ ] Escribir tests unitarios para procedimientos tRPC
- [ ] Escribir tests de integración para flujo de autenticación
- [ ] Escribir tests para módulo de scraping (mock de HyCite)
- [ ] Probar flujo completo: login → conectar HyCite → ver datos → exportar
- [ ] Probar roles: distribuidor ve todo, administrador ve solo asignado

### Validación
- [ ] Validar que la conexión con HyCite funciona correctamente
- [ ] Validar que los datos se extraen y almacenan correctamente
- [ ] Validar que el dashboard muestra datos en tiempo real
- [ ] Validar que la exportación a CSV/Excel funciona
- [ ] Validar que la sincronización con Google Sheets funciona
- [ ] Validar que los roles se aplican correctamente

### Documentación y Entrega
- [ ] Crear documentación de usuario (cómo conectar HyCite, usar dashboard, etc.)
- [ ] Crear guía de administrador (gestión de equipo, configuración, etc.)
- [ ] Preparar checkpoint final
- [ ] Entregar proyecto al usuario
