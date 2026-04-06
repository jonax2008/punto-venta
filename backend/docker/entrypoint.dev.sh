#!/bin/sh
set -e

cd /var/www/html

# ── Dependencias ──────────────────────────────────────────────────────────────
if [ ! -d "vendor" ]; then
    echo "[entrypoint] vendor/ no encontrado — instalando dependencias..."
    composer install --no-interaction --optimize-autoloader
fi

# ── App key ───────────────────────────────────────────────────────────────────
php artisan key:generate --no-interaction 2>/dev/null || true

# ── Config cache ──────────────────────────────────────────────────────────────
php artisan config:clear

# ── Esperar a que MySQL acepte conexiones ─────────────────────────────────────
echo "[entrypoint] Esperando conexión a la base de datos..."
MAX_TRIES=30
TRIES=0
until php artisan db:show --no-interaction > /dev/null 2>&1; do
    TRIES=$((TRIES + 1))
    if [ "$TRIES" -ge "$MAX_TRIES" ]; then
        echo "[entrypoint] ERROR: No se pudo conectar a la base de datos después de $MAX_TRIES intentos."
        exit 1
    fi
    echo "[entrypoint] Base de datos no disponible aún, reintentando ($TRIES/$MAX_TRIES)..."
    sleep 2
done
echo "[entrypoint] Base de datos lista."

# ── Sanctum migrations ────────────────────────────────────────────────────────
if ! find database/migrations -name "*create_personal_access_tokens_table.php" | grep -q .; then
    echo "[entrypoint] Publicando migraciones de Sanctum..."
    php artisan vendor:publish \
        --provider="Laravel\Sanctum\SanctumServiceProvider" \
        --tag="migrations" \
        --no-interaction
fi

# ── Migraciones ───────────────────────────────────────────────────────────────
echo "[entrypoint] Ejecutando migraciones..."
php artisan migrate --force --no-interaction

# ── Seeders (solo si la tabla groups está vacía) ──────────────────────────────
COUNT=$(php artisan tinker --execute="echo \App\Models\Group::count();" 2>/dev/null | tr -d '[:space:]' || echo "0")
if [ "$COUNT" = "0" ]; then
    echo "[entrypoint] Ejecutando seeders iniciales..."
    php artisan db:seed --force --no-interaction
fi

# ── Queue worker (background) ─────────────────────────────────────────────────
php artisan queue:work --sleep=3 --tries=3 --max-time=3600 &

# ── Scheduler loop (background) ───────────────────────────────────────────────
(while true; do php artisan schedule:run --no-interaction 2>/dev/null; sleep 60; done) &

echo "[entrypoint] Iniciando servidor en http://0.0.0.0:8000 (workers: ${PHP_CLI_SERVER_WORKERS:-1})"
# php artisan serve no hereda PHP_CLI_SERVER_WORKERS al subprocess que crea.
# Ejecutamos php -S directamente para que los workers se creen correctamente.
SERVER_FILE="$(php -r "echo realpath('vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php');")"
exec php -S 0.0.0.0:8000 "$SERVER_FILE"
