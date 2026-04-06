#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  logs.sh — Ver logs de los contenedores
#
#  Uso:
#    ./scripts/logs.sh                # logs de todos los servicios (follow)
#    ./scripts/logs.sh backend        # solo backend
#    ./scripts/logs.sh frontend       # solo frontend
#    ./scripts/logs.sh db             # solo base de datos
#    ./scripts/logs.sh --tail 50      # últimas 50 líneas sin follow
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

SERVICES=()
TAIL_LINES=100
FOLLOW=true

# ── Parsear argumentos ────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    backend|frontend|db)
      SERVICES+=("$1")
      shift
      ;;
    --tail)
      TAIL_LINES="${2:?'--tail requiere un número'}"
      FOLLOW=false
      shift 2
      ;;
    --no-follow|-n)
      FOLLOW=false
      shift
      ;;
    *)
      echo -e "${YELLOW}Argumento desconocido: $1${RESET}"
      echo "Uso: $0 [backend|frontend|db] [--tail N] [--no-follow]"
      exit 1
      ;;
  esac
done

# ── Mostrar qué se va a ver ───────────────────────────────────────────────────
if [[ ${#SERVICES[@]} -eq 0 ]]; then
  echo -e "\n${BOLD}${CYAN}Mostrando logs de todos los servicios${RESET}"
else
  echo -e "\n${BOLD}${CYAN}Mostrando logs de: ${SERVICES[*]}${RESET}"
fi

if $FOLLOW; then
  echo -e "${YELLOW}  Ctrl+C para salir${RESET}\n"
fi

# ── Ejecutar logs ─────────────────────────────────────────────────────────────
LOG_ARGS=(--tail="$TAIL_LINES")
$FOLLOW && LOG_ARGS+=(-f)

# shellcheck disable=SC2068
docker compose logs "${LOG_ARGS[@]}" ${SERVICES[@]+"${SERVICES[@]}"}
