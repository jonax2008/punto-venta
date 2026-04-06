#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  artisan.sh — Wrapper para php artisan dentro del contenedor backend
#
#  Uso:
#    ./scripts/artisan.sh migrate:status
#    ./scripts/artisan.sh tinker
#    ./scripts/artisan.sh db:seed --class=AdminUserSeeder
#    ./scripts/artisan.sh make:model Foo -m
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; RESET='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

if [[ $# -eq 0 ]]; then
  echo -e "${BOLD}Uso:${RESET} $0 <comando artisan> [argumentos...]"
  echo ""
  echo -e "${YELLOW}Ejemplos:${RESET}"
  echo "  $0 migrate:status"
  echo "  $0 tinker"
  echo "  $0 db:seed --class=AdminUserSeeder"
  echo "  $0 route:list --path=api"
  echo "  $0 queue:failed"
  exit 1
fi

# Verificar que el contenedor backend esté corriendo
if ! docker compose ps backend 2>/dev/null | grep -q "running\|Up"; then
  echo -e "${RED}✖ El contenedor backend no está corriendo.${RESET}"
  echo -e "  Inicia la aplicación con: ${YELLOW}./scripts/start.sh${RESET}"
  exit 1
fi

docker compose exec backend php artisan "$@"
