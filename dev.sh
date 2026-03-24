#!/usr/bin/env bash
# dev.sh — Start Capz local development environment
#
# What this does:
#   1. Opens a new Terminal window running the Hardhat node
#   2. Deploys SmartAccount + SmartAccountFactory to localhost
#   3. Writes contract addresses to packages/web/.env.local
#   4. Starts the Next.js dev server in the current terminal
#
# No external dependencies — uses macOS Terminal.app via osascript.
#
# Usage:
#   ./dev.sh           — start everything
#   ./dev.sh stop      — kill the hardhat node and next.js processes

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
CONTRACTS_DIR="$REPO_ROOT/packages/contracts"
WEB_DIR="$REPO_ROOT/packages/web"
ENV_FILE="$WEB_DIR/.env.local"

# ─── Colours ──────────────────────────────────────────────────────────────────
bold=$(tput bold 2>/dev/null || echo "")
green='\033[0;32m'
yellow='\033[0;33m'
red='\033[0;31m'
reset='\033[0m'

info()    { echo -e "${green}▶${reset} $*"; }
warn()    { echo -e "${yellow}⚠${reset}  $*"; }
err()     { echo -e "${red}✗${reset}  $*" >&2; }
section() { echo -e "\n${bold}── $* ──${reset}"; }

# ─── Stop ─────────────────────────────────────────────────────────────────────
if [[ "${1:-}" == "stop" ]]; then
  info "Stopping local dev processes..."
  for port in 8545 3000; do
    pid=$(lsof -ti ":$port" 2>/dev/null || true)
    if [[ -n "$pid" ]]; then
      kill -9 $pid 2>/dev/null && info "Killed process on :$port (PID $pid)." || true
    fi
  done
  exit 0
fi

# ─── Kill any stale processes ─────────────────────────────────────────────────
section "Clearing ports"
for port in 8545 3000; do
  pid=$(lsof -ti ":$port" 2>/dev/null || true)
  if [[ -n "$pid" ]]; then
    warn "Port $port in use — killing PID $pid."
    kill -9 $pid 2>/dev/null || true
    sleep 0.3
  fi
done

# ─── Compile ──────────────────────────────────────────────────────────────────
section "Compiling contracts"
(cd "$CONTRACTS_DIR" && pnpm compile) || { err "Compilation failed."; exit 1; }
info "Compiled."

# ─── Launch Hardhat node in a new Terminal window ─────────────────────────────
section "Starting Hardhat node"
osascript <<EOF
tell application "Terminal"
  activate
  set chainWin to do script "cd '$CONTRACTS_DIR' && echo '=== Hardhat node :8545 ===' && pnpm exec hardhat node"
  set custom title of chainWin to "capz · chain"
end tell
EOF
info "Hardhat node window opened."

# ─── Wait for chain ───────────────────────────────────────────────────────────
section "Waiting for :8545"
WAIT=0
MAX=30
printf "  waiting"
until nc -z 127.0.0.1 8545 2>/dev/null; do
  sleep 1
  WAIT=$((WAIT+1))
  printf "."
  if [[ $WAIT -ge $MAX ]]; then
    echo
    err "Hardhat node didn't come up after ${MAX}s."
    err "Check the Terminal window titled 'capz · chain' for errors."
    exit 1
  fi
done
echo " ready."

# ─── Deploy ───────────────────────────────────────────────────────────────────
section "Deploying contracts"
DEPLOY_LOG=$(cd "$CONTRACTS_DIR" && pnpm deploy:local 2>&1)
echo "$DEPLOY_LOG"

FACTORY_ADDR=$(echo "$DEPLOY_LOG" | grep -o 'NEXT_PUBLIC_LOCALHOST_FACTORY_ADDRESS="[^"]*"' | grep -o '0x[0-9a-fA-F]*' | head -1)
IMPL_ADDR=$(echo    "$DEPLOY_LOG" | grep -o 'NEXT_PUBLIC_LOCALHOST_IMPL_ADDRESS="[^"]*"'    | grep -o '0x[0-9a-fA-F]*' | head -1)

if [[ -z "$FACTORY_ADDR" ]]; then
  err "Could not parse factory address from deploy output. Did deployment fail?"
  exit 1
fi
info "Factory:        $FACTORY_ADDR"
info "Implementation: ${IMPL_ADDR:-n/a}"

# ─── Write .env.local ─────────────────────────────────────────────────────────
section "Writing packages/web/.env.local"

upsert_env() {
  local key="$1" val="$2"
  if [[ -f "$ENV_FILE" ]] && grep -q "^${key}=" "$ENV_FILE"; then
    sed -i.bak "s|^${key}=.*|${key}=${val}|" "$ENV_FILE" && rm -f "${ENV_FILE}.bak"
  else
    echo "${key}=${val}" >> "$ENV_FILE"
  fi
}

if [[ ! -f "$ENV_FILE" ]]; then
  touch "$ENV_FILE"
  info "Created $ENV_FILE"
fi

upsert_env "NEXT_PUBLIC_LOCAL_DEV"                 "true"
upsert_env "NEXT_PUBLIC_LOCALHOST_FACTORY_ADDRESS" "$FACTORY_ADDR"
upsert_env "NEXT_PUBLIC_LOCALHOST_IMPL_ADDRESS"    "${IMPL_ADDR:-}"

echo
cat "$ENV_FILE"
info ".env.local updated."

# ─── Start Next.js in current terminal ────────────────────────────────────────
echo
echo -e "${bold}${green}✓ Contracts deployed. Starting Next.js...${reset}"
echo
echo -e "  ${bold}Hardhat chain${reset}  → Terminal window 'capz · chain'  :8545"
echo -e "  ${bold}Next.js app${reset}    → this terminal (below)            http://localhost:3000"
echo
echo -e "  Stop everything: ${bold}./dev.sh stop${reset}  (or Ctrl-C here + close the chain window)"
echo

cd "$WEB_DIR" && pnpm dev
