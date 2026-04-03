#!/bin/sh
set -e

cd /var/www/html

# Generate app key if not set
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ]; then
    php artisan key:generate --no-interaction
fi

# Wait for database and run migrations
php artisan migrate --force --no-interaction

# Publish Sanctum config if needed
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider" --no-interaction 2>/dev/null || true

# Clear and cache config
php artisan config:clear
php artisan route:clear

# Start supervisord
exec /usr/bin/supervisord -c /etc/supervisord.conf
