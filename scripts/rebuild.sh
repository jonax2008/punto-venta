#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  rebuild.sh — Limpia todo y reconstruye desde cero
#
#  Uso:
#    ./scripts/rebuild.sh            # borra volúmenes y reconstruye
#    ./scripts/rebuild.sh --keep-db  # reconstruye imágenes sin borrar la BD
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log_step()  { echo -e "\n${BOLD}${BLUE}▶ $*${RESET}"; }
log_ok()    { echo -e "  ${GREEN}✔ $*${RESET}"; }
log_warn()  { echo -e "  ${YELLOW}⚠ $*${RESET}"; }
log_error() { echo -e "  ${RED}✖ $*${RESET}"; }
log_info()  { echo -e "  ${CYAN}→ $*${RESET}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo -e "\n${BOLD}╔══════════════════════════════════════╗"
echo -e "║   Punto de Venta — Rebuild Completo  ║"
echo -e "╚══════════════════════════════════════╝${RESET}"

# ── Flags ─────────────────────────────────────────────────────────────────────
KEEP_DB=false
for arg in "$@"; do
  [[ "$arg" == "--keep-db" ]] && KEEP_DB=true
done

# ── Prerrequisito: Docker ─────────────────────────────────────────────────────
log_step "Verificando Docker"
if ! docker info &>/dev/null; then
  log_error "Docker no está corriendo. Ábrelo e intenta de nuevo."
  exit 1
fi
log_ok "Docker disponible"

# ── Confirmación ──────────────────────────────────────────────────────────────
if $KEEP_DB; then
  echo -e "\n${YELLOW}Se reconstruirán las imágenes sin borrar la base de datos.${RESET}"
else
  echo -e "\n${RED}${BOLD}ADVERTENCIA: Esto borrará todos los volúmenes (incluida la BD).${RESET}"
  echo -e "${YELLOW}Los datos de MySQL se perderán y el seeder volverá a ejecutarse.${RESET}"
fi
echo ""
read -rp "  ¿Continuar? [s/N] " CONFIRM
if [[ ! "$CONFIRM" =~ ^[sS]$ ]]; then
  echo -e "\n  ${YELLOW}Cancelado.${RESET}\n"
  exit 0
fi

# ── Detener y limpiar ─────────────────────────────────────────────────────────
log_step "Deteniendo contenedores"
docker compose down --remove-orphans
log_ok "Contenedores detenidos"

if ! $KEEP_DB; then
  log_step "Eliminando volúmenes"
  docker compose down -v 2>/dev/null || true
  log_ok "Volúmenes eliminados"
fi

# ── Limpiar imágenes del proyecto ─────────────────────────────────────────────
log_step "Eliminando imágenes del proyecto"
docker compose images -q 2>/dev/null | xargs docker rmi -f 2>/dev/null || true
log_ok "Imágenes eliminadas"

# ── Reconstruir ───────────────────────────────────────────────────────────────
log_step "Construyendo imágenes sin caché"
log_info "Esto puede tardar ~3-5 minutos..."
docker compose build --no-cache 2>&1 | \
  grep -E "^#|Step|=>|ERROR|successfully built|writing image" | sed 's/^/  /'
log_ok "Imágenes construidas"

# ── Levantar ──────────────────────────────────────────────────────────────────
log_step "Levantando contenedores"
docker compose up -d
log_ok "Contenedores iniciados"

# ── Esperar MySQL ─────────────────────────────────────────────────────────────
log_step "Esperando MySQL"
MAX_WAIT=90
WAITED=0
printf "  "
until docker compose exec -T db mysqladmin ping -h localhost -u root -psecret --silent 2>/dev/null; do
  printf "."
  sleep 2
  WAITED=$((WAITED + 2))
  if [[ $WAITED -ge $MAX_WAIT ]]; then
    echo ""
    log_error "MySQL no respondió en ${MAX_WAIT}s"
    echo -e "\n${YELLOW}Logs de la base de datos:${RESET}"
    docker compose logs --tail=30 db
    exit 1
  fi
done
echo ""
log_ok "MySQL listo"

# ── Esperar Backend ───────────────────────────────────────────────────────────
log_step "Esperando backend (migraciones + servidor)"
MAX_WAIT=180
WAITED=0
printf "  "
until curl -sf http://localhost:8000/up &>/dev/null; do
  printf "."
  sleep 3
  WAITED=$((WAITED + 3))
  if [[ $WAITED -ge $MAX_WAIT ]]; then
    echo ""
    log_error "Backend no respondió en ${MAX_WAIT}s"
    echo -e "\n${YELLOW}Últimos logs del backend:${RESET}"
    docker compose logs --tail=40 backend
    exit 1
  fi
done
echo ""
log_ok "Backend listo en http://localhost:8000"

# ── Esperar Frontend ──────────────────────────────────────────────────────────
log_step "Esperando frontend"
MAX_WAIT=90
WAITED=0
printf "  "
until curl -sf http://localhost:5173 &>/dev/null; do
  printf "."
  sleep 2
  WAITED=$((WAITED + 2))
  if [[ $WAITED -ge $MAX_WAIT ]]; then
    echo ""
    log_warn "Frontend tardando más de lo esperado — revisa: docker compose logs frontend"
    break
  fi
done
echo ""
log_ok "Frontend listo en http://localhost:5173"

# ── Estado final ──────────────────────────────────────────────────────────────
log_step "Estado de los contenedores"
docker compose ps

echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════╗"
echo -e "║     ¡Rebuild completado con éxito!   ║"
echo -e "╚══════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${BOLD}Frontend${RESET}  →  ${CYAN}http://localhost:5173${RESET}"
echo -e "  ${BOLD}API${RESET}       →  ${CYAN}http://localhost:8000/api${RESET}"
echo -e "  ${BOLD}MySQL${RESET}     →  localhost:${CYAN}3307${RESET}"
echo ""
echo -e "  ${BOLD}Login inicial:${RESET}"
echo -e "    Email:    ${CYAN}admin@puntoventa.local${RESET}"
echo -e "    Password: ${CYAN}password${RESET}"
echo ""
