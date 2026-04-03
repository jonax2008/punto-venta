FROM php:8.3-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    curl \
    git \
    unzip \
    libpng-dev \
    libzip-dev \
    oniguruma-dev \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        mbstring \
        zip \
        gd \
        pcntl

# Install Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy composer files first for layer caching
COPY composer.json composer.lock ./

RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy application code
COPY . .

RUN composer dump-autoload --optimize \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Copy nginx and supervisor config
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
