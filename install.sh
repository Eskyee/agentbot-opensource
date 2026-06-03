#!/usr/bin/env bash
set -euo pipefail

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Agentbot — One-line local install
# Usage: curl -sSL https://agentbot.sh/install.sh | bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BOLD='\033[1m'
DIM='\033[2m'
ORANGE='\033[38;5;208m'
GREEN='\033[32m'
RED='\033[31m'
RESET='\033[0m'

AGENTBOT_DIR="${AGENTBOT_DIR:-$HOME/.agentbot}"
COMPOSE_URL="https://raw.githubusercontent.com/Eskyee/agentbot/main/docker-compose.yml"
ENV_URL="https://raw.githubusercontent.com/Eskyee/agentbot/main/.env.example"

info()  { echo -e "${DIM}[agentbot]${RESET} $*"; }
ok()    { echo -e "${GREEN}✓${RESET} $*"; }
err()   { echo -e "${RED}✗${RESET} $*" >&2; }
header() { echo -e "\n${ORANGE}${BOLD}$*${RESET}"; }

# ━━━ Check prerequisites ━━━
header "🦞 Agentbot — Local Install"

# Check Docker
if ! command -v docker &>/dev/null; then
  info "Docker not found. Installing..."
  
  # Detect OS
  OS="$(uname -s)"
  case "$OS" in
    Darwin)
      err "Docker Desktop required on macOS."
      echo ""
      echo "  Install Docker Desktop:"
      echo "  ${BOLD}https://www.docker.com/products/docker-desktop/${RESET}"
      echo ""
      echo "  Or via Homebrew:"
      echo "  ${BOLD}brew install --cask docker${RESET}"
      echo ""
      echo "  After installing, open Docker Desktop once, then re-run this script."
      exit 1
      ;;
    Linux)
      info "Installing Docker via official script..."
      curl -fsSL https://get.docker.com | sh
      if ! command -v docker &>/dev/null; then
        err "Docker installation failed. Install manually: https://docs.docker.com/engine/install/"
        exit 1
      fi
      ok "Docker installed"
      # Start Docker daemon
      sudo systemctl start docker 2>/dev/null || sudo service docker start 2>/dev/null || true
      ;;
    *)
      err "Unsupported OS: $OS"
      echo "  Install Docker manually: https://docs.docker.com/engine/install/"
      exit 1
      ;;
  esac
fi

# Check Docker is running
if ! docker info &>/dev/null; then
  err "Docker is installed but not running."
  echo ""
  echo "  Start Docker Desktop (macOS) or run: sudo systemctl start docker (Linux)"
  echo "  Then re-run this script."
  exit 1
fi

ok "Docker $(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')"

# Check docker compose
if docker compose version &>/dev/null; then
  ok "Docker Compose (plugin)"
elif command -v docker-compose &>/dev/null; then
  ok "Docker Compose (standalone)"
else
  err "Docker Compose not found."
  echo "  Update Docker Desktop or install compose: https://docs.docker.com/compose/install/"
  exit 1
fi

# ━━━ Create project directory ━━━
header "📁 Setting up"
mkdir -p "$AGENTBOT_DIR"
cd "$AGENTBOT_DIR"
ok "Directory: $AGENTBOT_DIR"

# ━━━ Download compose file ━━━
info "Downloading docker-compose.yml..."
curl -sSL "$COMPOSE_URL" -o docker-compose.yml
ok "docker-compose.yml"

# ━━━ Create .env if missing ━━━
if [ ! -f .env ]; then
  info "Creating .env from template..."
  curl -sSL "$ENV_URL" -o .env 2>/dev/null || cat > .env << 'ENVEOF'
# ━━━ Agentbot Configuration ━━━
# Get your MiMo API key: https://mimo.xiaomi.com
MIMO_API_KEY=your-mimo-key-here

# Get your OpenRouter key (fallback): https://openrouter.ai/keys
OPENROUTER_API_KEY=

# Telegram bot token (from @BotFather)
TELEGRAM_BOT_TOKEN=

# Agentbot settings
NODE_ENV=production
ENVEOF
  ok ".env created"
  echo ""
  echo -e "  ${BOLD}⚠ Edit .env before starting:${RESET}"
  echo "  nano $AGENTBOT_DIR/.env"
  echo ""
else
  ok ".env already exists"
fi

# ━━━ Pull images ━━━
header "🐳 Pulling images"
docker compose pull

# ━━━ Start services ━━━
header "🚀 Starting Agentbot"
docker compose up -d

# ━━━ Health check ━━━
info "Waiting for services to start..."
sleep 5

HEALTHY=0
for i in {1..12}; do
  if curl -sf http://localhost:3010/api/health &>/dev/null; then
    HEALTHY=1
    break
  fi
  sleep 5
done

# ━━━ Done ━━━
header "✅ Agentbot is running!"
echo ""
echo "  ${BOLD}Dashboard:${RESET}   http://localhost:3010"
echo "  ${BOLD}Backend:${RESET}     http://localhost:3001"
echo "  ${BOLD}Database:${RESET}    localhost:5432 (postgres)"
echo "  ${BOLD}Cache:${RESET}       localhost:6379 (redis)"
echo ""
echo "  ${DIM}Logs:${RESET}        docker compose -f $AGENTBOT_DIR/docker-compose.yml logs -f"
echo "  ${DIM}Stop:${RESET}        docker compose -f $AGENTBOT_DIR/docker-compose.yml down"
echo "  ${DIM}Update:${RESET}      curl -sSL https://agentbot.sh/install.sh | bash"
echo ""

if [ "$HEALTHY" -eq 1 ]; then
  echo -e "  ${GREEN}Open http://localhost:3010 to get started${RESET}"
else
  echo -e "  ${ORANGE}Services are starting. Check logs if the dashboard doesn't load:${RESET}"
  echo "  docker compose -f $AGENTBOT_DIR/docker-compose.yml logs"
fi

echo ""
