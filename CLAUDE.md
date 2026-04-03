# CLAUDE.md — Contexto para el agente

Este archivo orienta a Claude Code sobre cómo trabajar en este repositorio.

## Proyecto

Sistema de punto de venta para una cooperativa de alimentos con rotación semanal de grupos de vendedores. El backend expone una API REST; el frontend es una SPA.

## Comandos esenciales

### Levantar el entorno

```bash
docker compose up -d            # arranca los 3 contenedores
docker compose logs -f backend  # ver logs del backend
docker compose logs -f frontend # ver logs del frontend
```

### Backend (Laravel)

```bash
# Todos los comandos artisan corren dentro del contenedor
docker compose exec backend php artisan migrate
docker compose exec backend php artisan migrate:fresh --seed
docker compose exec backend php artisan db:seed
docker compose exec backend php artisan route:list
docker compose exec backend php artisan queue:work    # procesar jobs manualmente
docker compose exec backend php artisan schedule:run  # disparar scheduler manualmente
```

### Frontend (React)

```bash
# Build de producción (verifica errores TS)
docker run --rm -v "$(pwd)/frontend:/app" -w /app node:22-alpine npm run build

# El servidor de desarrollo se levanta automáticamente con docker compose up
# Hot-reload disponible en http://localhost:5173
```

### Base de datos

```bash
docker compose exec db mysql -u pvuser -ppvpassword puntoventa
```

## Arquitectura

### Backend (`backend/`)

**Laravel 11 en modo API-only.** Sin vistas Blade. Todo responde JSON.

```
app/
├── Http/Controllers/       # Un controller por entidad
│   └── Auth/               # Login, Logout, GoogleAuth
├── Http/Middleware/
│   ├── EnsureUserHasRole.php          # uso: middleware('role:admin,cashier')
│   └── EnsureActiveCashRegister.php   # bloquea pedidos sin caja abierta
├── Http/Requests/          # Validación de entrada (Form Requests)
├── Http/Resources/         # Transformación de salida (API Resources)
├── Jobs/
│   └── IncrementProductFrequency.php  # job queued al confirmar pedido
├── Models/                 # Eloquent models con relaciones completas
├── Observers/
│   └── ExpenseObserver.php            # actualiza total_expenses en cash_registers
└── Services/
    ├── OrderService.php               # lógica de crear/confirmar/cancelar pedidos
    └── CashRegisterService.php        # abrir, cerrar, auto-cerrar cajas
```

**Rutas importantes (`routes/api.php`):**
- `POST /api/auth/login` — devuelve `{ token, user }`
- `GET  /api/auth/google/redirect` — devuelve `{ redirect_url }` para OAuth
- `GET  /api/orders/{order}/track` — SSE stream público del estado del pedido
- `POST /api/orders` — requiere middleware `active.cash-register`
- `GET  /api/products?group_id=N` — lista con ORDER BY frecuencia del grupo

**Scheduler (`routes/console.php`):**
- `23:59` diario → `CashRegisterService::autoCloseAll()`

**Queue driver:** `database` (tabla `jobs`). Para procesar en dev: `php artisan queue:work`.

### Base de datos

Orden de dependencias de las migraciones:

```
groups → users → products
                        ↘
                         product_group_frequencies
groups → cash_registers → orders → order_items
                                 ↗
                         users (cashier_id, client_id)
cash_registers → expenses
users → client_profiles
```

**Tabla clave:** `product_group_frequencies` — índice `(group_id, frequency DESC)` para ordenamiento eficiente. Se actualiza vía job `IncrementProductFrequency` al confirmar un pedido.

**Regla de negocio crítica:** Solo un `cash_register` con `status = 'open'` por `group_id` a la vez. Validado en `CashRegisterService::open()`.

### Frontend (`frontend/src/`)

**React 18 SPA** con React Router v6, TanStack Query v5 y Zustand.

```
api/         # funciones axios por entidad (client.ts tiene los interceptors de auth)
components/
  layout/    # AppShell (sidebar desktop + nav inferior mobile), Sidebar, Topbar, MobileNav
  orders/    # ProductPicker (grid con frecuencia), OrderStatusBadge
  shared/    # Toast, ConfirmDialog, LoadingSpinner, ErrorBoundary, EmptyState
hooks/
  useAuth.ts          # lee authStore, expone helpers de rol
  useOrderTracker.ts  # EventSource SSE para /api/orders/{id}/track
pages/       # una carpeta por sección, cada archivo = una página completa
router/
  ProtectedRoute.tsx  # redirige a /login si no hay token; filtra por roles
  GuestRoute.tsx      # redirige a /dashboard si ya está autenticado
stores/
  authStore.ts   # token + user persistidos en localStorage (Zustand persist)
  cartStore.ts   # items del pedido en curso (Zustand, efímero)
types/
  models.ts      # interfaces TypeScript de todas las entidades
```

**Estado:**
- Servidor (pedidos, productos, usuarios, caja): TanStack Query
- UI efímera (carrito, modal abierto): Zustand
- Auth: Zustand con `persist` middleware → `localStorage`

**Estilos:** Tailwind CSS v3. Las clases reutilizables (`btn-primary`, `card`, `badge-confirmed`, etc.) están definidas en `src/index.css` bajo `@layer components`.

**Path alias:** `@/` apunta a `src/`. Configurado en `vite.config.ts` y `tsconfig.app.json`.

## Convenciones

- **Modelos Eloquent:** relaciones definidas en el modelo, nombres en camelCase (`openedBy`, `cashier`).
- **API Resources:** siempre serializar decimales como `(float)` para evitar strings en JSON.
- **Snapshots en `order_items`:** `product_name` y `product_price` se guardan al momento de la venta y nunca se actualizan.
- **Soft delete no se usa:** los productos se desactivan (`is_active = false`), no se eliminan.
- **Jobs:** usar `ShouldQueue` y driver `database`. No usar `dispatchSync` salvo tests.
- **Componentes React:** functional components con TypeScript estricto. No usar `any` salvo workarounds de tipos de terceros documentados con comentario.

## Flujo de autenticación

### Staff (admin, group_manager, cashier)
```
POST /api/auth/login → { token } → localStorage('auth_token') → header Authorization: Bearer <token>
```

### Clientes (Google OAuth)
```
GET /api/auth/google/redirect → { redirect_url }
→ window.location.href = redirect_url
→ Google → GET /api/auth/google/callback
→ redirect frontend /auth/callback?token=<token>
→ OAuthCallbackPage lee token, fetch /api/me, guarda en authStore
```

## Puntos de atención al modificar código

1. **Agregar un nuevo endpoint:** definir ruta en `routes/api.php` con el middleware de rol correcto → crear o actualizar controller → crear Form Request si tiene body → crear/actualizar API Resource.

2. **Agregar una nueva página React:** crear archivo en `pages/` → agregar ruta en `router/index.tsx` → agregar link en `Sidebar.tsx` y `MobileNav.tsx` si es navegación principal.

3. **Cambiar el schema de BD:** nueva migración (nunca editar migraciones existentes en main) → actualizar modelo Eloquent (`$fillable`, `casts`, relaciones) → actualizar API Resource → actualizar tipo TypeScript en `frontend/src/types/models.ts`.

4. **Variables de entorno:** backend lee de `backend/.env`; frontend lee de `frontend/.env` (prefijo `VITE_`). Docker Compose inyecta las del root `.env` al servicio `backend`.

5. **El scheduler corre dentro del contenedor** via loop en `entrypoint.dev.sh`. Para probar manualmente: `docker compose exec backend php artisan schedule:run`.
