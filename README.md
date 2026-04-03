# Punto de Venta

Sistema de punto de venta para cooperativas de alimentos. Permite gestionar pedidos, productos, cortes de caja y reportes de ventas por grupo rotativo.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Laravel 11 (API-only) · PHP 8.3 |
| Frontend | React 18 · TypeScript · Vite |
| Base de datos | MySQL 8.4 |
| Auth staff | Laravel Sanctum (Bearer token) |
| Auth clientes | Google OAuth → Sanctum |
| Infraestructura | Docker Compose |

## Requisitos

- Docker y Docker Compose

No se requiere PHP, Node, ni Composer instalados localmente.

## Instalación y arranque

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd punto-venta

# 2. (Opcional) Configurar Google OAuth
cp .env.example .env
# Editar .env y agregar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET

# 3. Levantar los tres contenedores
docker compose up -d

# 4. Esperar ~20s para que MySQL arranque y las migraciones corran automáticamente
```

### URLs

| Servicio | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000/api |

### Credenciales iniciales

```
Email:    admin@puntoventa.local
Password: password
```

## Comandos útiles

```bash
# Ver logs
docker compose logs -f

# Ejecutar artisan
docker compose exec backend php artisan <comando>

# Correr migraciones manualmente
docker compose exec backend php artisan migrate

# Correr seeders
docker compose exec backend php artisan db:seed

# Acceder a MySQL
docker compose exec db mysql -u pvuser -ppvpassword puntoventa

# Detener contenedores
docker compose down

# Detener y eliminar volúmenes (resetea la BD)
docker compose down -v
```

## Estructura del proyecto

```
punto-venta/
├── backend/                    # Laravel 11 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/    # GroupController, OrderController, etc.
│   │   │   ├── Middleware/     # EnsureUserHasRole, EnsureActiveCashRegister
│   │   │   ├── Requests/       # Form Requests con validación
│   │   │   └── Resources/      # API Resources (transformadores JSON)
│   │   ├── Jobs/               # IncrementProductFrequency (queue)
│   │   ├── Models/             # Eloquent models
│   │   ├── Observers/          # ExpenseObserver
│   │   └── Services/           # OrderService, CashRegisterService
│   ├── database/
│   │   ├── migrations/         # 10 migraciones en orden
│   │   └── seeders/            # GroupSeeder, AdminUserSeeder
│   ├── routes/
│   │   ├── api.php             # Todas las rutas de la API
│   │   └── console.php         # Scheduler (auto-cierre de caja)
│   └── docker/                 # nginx.conf, supervisord.conf, entrypoint
│
├── frontend/                   # React 18 SPA
│   └── src/
│       ├── api/                # Funciones de acceso a la API (axios)
│       ├── components/
│       │   ├── layout/         # AppShell, Sidebar, Topbar, MobileNav
│       │   ├── orders/         # ProductPicker, OrderStatusBadge
│       │   └── shared/         # Toast, ConfirmDialog, LoadingSpinner, ErrorBoundary
│       ├── hooks/              # useAuth, useOrderTracker (SSE)
│       ├── pages/              # Una carpeta por sección
│       ├── router/             # ProtectedRoute, GuestRoute
│       ├── stores/             # authStore, cartStore (Zustand)
│       └── types/              # TypeScript models
│
├── docker-compose.yml
└── .env.example
```

## Roles y permisos

| Rol | Acceso |
|-----|--------|
| `admin` | Todo: grupos, usuarios, productos, pedidos, caja, reportes |
| `group_manager` | Usuarios de su grupo, productos, pedidos de su grupo, caja, reportes |
| `cashier` | Pedidos de su grupo, caja |
| `client` | Ver productos, crear pedidos propios (solo con caja abierta), tracker |

## Grupos

Los grupos son fijos y se crean con el seed inicial:

- Señoritas
- Jóvenes
- Casadas
- Solas

## Funcionalidades principales

### Punto de venta (POS)
- Crea pedidos desde un grid de productos ordenados por frecuencia de venta del grupo activo
- Los productos más vendidos por ese grupo aparecen primero
- Confirma o cancela pedidos en tiempo real

### Corte de caja
- Abre y cierra la caja al inicio/fin del turno
- Registra egresos (gastos del turno)
- Si no se cierra manualmente, se cierra automáticamente a las 23:59
- Solo puede haber un corte abierto por grupo a la vez

### Tracker de pedidos
- URL pública: `http://localhost:5173/track/{id}`
- Se actualiza en tiempo real vía SSE (Server-Sent Events) sin polling del cliente

### Reportes
- Ventas por grupo (comparativo entre Señoritas, Jóvenes, Casadas, Solas)
- Productos más vendidos (filtrable por grupo y rango de fechas)
- Historial de cortes de caja

### Google OAuth (clientes)
1. Configura `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en `backend/.env`
2. En Google Cloud Console, agrega `http://localhost:8000/api/auth/google/callback` como URI de redirección autorizado
3. Los clientes inician sesión con Google y pueden hacer pedidos mientras haya una caja abierta

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DB_HOST` | Host de MySQL | `db` |
| `DB_DATABASE` | Nombre de la BD | `puntoventa` |
| `DB_USERNAME` | Usuario MySQL | `pvuser` |
| `DB_PASSWORD` | Contraseña MySQL | `pvpassword` |
| `FRONTEND_URL` | URL del frontend para OAuth redirect | `http://localhost:5173` |
| `GOOGLE_CLIENT_ID` | ID de cliente Google OAuth | — |
| `GOOGLE_CLIENT_SECRET` | Secreto Google OAuth | — |

### Frontend (`frontend/.env`)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_API_URL` | URL base del backend | `http://localhost:8000` |
