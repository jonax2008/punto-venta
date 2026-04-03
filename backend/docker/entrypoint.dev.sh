#!/bin/sh
set -e

cd /var/www/html

# Install composer dependencies if vendor doesn't exist
if [ ! -d "vendor" ]; then
    composer install --no-interaction
fi

# Generate app key if not set
php artisan key:generate --no-interaction 2>/dev/null || true

# Clear config cache to read fresh env vars
php artisan config:clear

# Publish Sanctum if not already done
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider" --no-interaction 2>/dev/null || true

# Run migrations
php artisan migrate --force --no-interaction

# Run seeders (only if groups table is empty)
php artisan db:seed --force --no-interaction 2>/dev/null || true

# Start queue worker in background
php artisan queue:work --sleep=3 --tries=3 &

# Start scheduler loop in background
(while true; do php artisan schedule:run; sleep 60; done) &

# Start development server
exec php artisan serve --host=0.0.0.0 --port=8000
