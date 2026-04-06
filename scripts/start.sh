#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  start.sh — Levanta la aplicación Punto de Venta
#
#  Uso:
#    ./scripts/start.sh           # levanta (construye imágenes si no existen)
#    ./scripts/start.sh --build   # fuerza rebuild de imágenes
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colores ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log_step()  { echo -e "\n${BOLD}${BLUE}▶ $*${RESET}"; }
log_ok()    { echo -e "  ${GREEN}✔ $*${RESET}"; }
log_warn()  { echo -e "  ${YELLOW}⚠ $*${RESET}"; }
log_error() { echo -e "  ${RED}✖ $*${RESET}"; }
log_info()  { echo -e "  ${CYAN}→ $*${RESET}"; }

# ── Ir al directorio raíz del proyecto ───────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# ── Banner ────────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}╔══════════════════════════════════════╗"
echo -e "║      Punto de Venta — Arranque       ║"
echo -e "╚══════════════════════════════════════╝${RESET}"

# ── Flags ─────────────────────────────────────────────────────────────────────
FORCE_BUILD=false
for arg in "$@"; do
  [[ "$arg" == "--build" ]] && FORCE_BUILD=true
done

# ── Prerrequisito: Docker ─────────────────────────────────────────────────────
log_step "Verificando Docker"
if ! docker info &>/dev/null; then
  log_error "Docker no está corriendo. Ábrelo e intenta de nuevo."
  exit 1
fi
log_ok "Docker disponible ($(docker --version | cut -d' ' -f3 | tr -d ','))"

# ── Construir imágenes ────────────────────────────────────────────────────────
log_step "Construyendo imágenes"

if $FORCE_BUILD; then
  log_info "Modo --build: reconstruyendo sin caché..."
  docker compose build --no-cache 2>&1 | \
    grep -E "^#|Step|=>|ERROR|successfully" | sed 's/^/  /'
else
  # Solo construye si la imagen no existe
  BACKEND_IMG=$(docker compose images -q backend 2>/dev/null || true)
  FRONTEND_IMG=$(docker compose images -q frontend 2>/dev/null || true)

  if [[ -z "$BACKEND_IMG" || -z "$FRONTEND_IMG" ]]; then
    log_info "Primera ejecución — construyendo imágenes (puede tardar ~3 min)..."
    docker compose build 2>&1 | \
      grep -E "^#|Step|=>|ERROR|successfully" | sed 's/^/  /'
  else
    log_ok "Imágenes ya existen — se omite el build (usa --build para forzar)"
  fi
fi

# ── Levantar contenedores ─────────────────────────────────────────────────────
log_step "Levantando contenedores"
docker compose up -d
log_ok "Contenedores iniciados"

# ── Esperar MySQL ─────────────────────────────────────────────────────────────
log_step "Esperando MySQL"
MAX_WAIT=60
WAITED=0
printf "  "
until docker compose exec -T db mysqladmin ping -h localhost -u root -psecret --silent 2>/dev/null; do
  printf "."
  sleep 2
  WAITED=$((WAITED + 2))
  if [[ $WAITED -ge $MAX_WAIT ]]; then
    echo ""
    log_error "MySQL no respondió en ${MAX_WAIT}s"
    echo ""
    echo -e "${YELLOW}Logs de la base de datos:${RESET}"
    docker compose logs --tail=20 db
    exit 1
  fi
done
echo ""
log_ok "MySQL listo"

# ── Esperar Backend ───────────────────────────────────────────────────────────
log_step "Esperando backend (migraciones + servidor)"
MAX_WAIT=120
WAITED=0
printf "  "
until curl -sf http://localhost:8000/up &>/dev/null; do
  printf "."
  sleep 3
  WAITED=$((WAITED + 3))
  if [[ $WAITED -ge $MAX_WAIT ]]; then
    echo ""
    log_error "Backend no respondió en ${MAX_WAIT}s"
    echo ""
    echo -e "${YELLOW}Últimos logs del backend:${RESET}"
    docker compose logs --tail=30 backend
    exit 1
  fi
done
echo ""
log_ok "Backend listo en http://localhost:8000"

# ── Esperar Frontend ──────────────────────────────────────────────────────────
log_step "Esperando frontend"
MAX_WAIT=60
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
echo -e "║        ¡Aplicación en línea!         ║"
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
echo -e "  ${YELLOW}Ver logs:${RESET}  ./scripts/logs.sh"
echo -e "  ${YELLOW}Detener:${RESET}   docker compose stop"
echo ""
