#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

mkdir -p .run

if [ ! -f .env ] && [ -f .env.local ]; then
  cp .env.local .env
fi

ensure_deps() {
  local dir="$1"
  if [ ! -d "$dir/node_modules" ]; then
    npm --prefix "$dir" install
  fi
}

start_service() {
  local name="$1"
  local port="$2"
  local command="$3"
  local logfile=".run/${name}.log"
  local pidfile=".run/${name}.pid"

  if lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    existing_pid=$(lsof -tiTCP:"$port" -sTCP:LISTEN | head -n 1 || true)
    if [ -z "${existing_pid:-}" ]; then
      echo "⚠️ Port :$port is in use, but no listener PID could be determined."
      exit 1
    fi

    existing_cwd=$(lsof -a -p "$existing_pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1 || true)
    if [[ -n "${existing_cwd:-}" && ( "$existing_cwd" == "$PWD" || "$existing_cwd" == "$PWD"/* ) ]]; then
      echo "$existing_pid" > "$pidfile"
      echo "✅ $name already listening on :$port"
      return
    fi

    echo "⚠️ Port :$port is already in use by a non-workspace process (PID $existing_pid)."
    echo "   Stop that process or free the port before starting StartClaw."
    exit 1
  fi

  nohup bash -lc "$command" > "$logfile" 2>&1 &
  echo $! > "$pidfile"
  sleep 2

  if lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "✅ $name started on :$port"
  else
    echo "❌ Failed to start $name. Check $logfile"
    exit 1
  fi
}

echo "🦞 Starting StartClaw locally"

if docker info >/dev/null 2>&1; then
  set +e
  docker compose up -d
  compose_status=$?
  set -e
  if [ $compose_status -eq 0 ]; then
    sleep 3
    frontend_ok=0
    api_ok=0

    if curl -s --max-time 3 http://localhost:3000 >/dev/null; then
      frontend_ok=1
    fi

    if curl -s --max-time 3 http://localhost:3001/health >/dev/null; then
      api_ok=1
    fi

    if [ $frontend_ok -eq 1 ] && [ $api_ok -eq 1 ]; then
      echo "✅ Docker services started"
      echo "Frontend: http://localhost:3000"
      echo "API:      http://localhost:3001"
      exit 0
    fi

    echo "⚠️ Docker services are not fully healthy. Falling back to local Node services."
  else
    echo "⚠️ Docker compose failed. Falling back to local Node services."
  fi
else
  echo "⚠️ Docker not available. Falling back to local Node services."
fi

ensure_deps "agentbot-backend"
ensure_deps "web"

start_service "api" 3001 "npm --prefix agentbot-backend run dev"
start_service "frontend" 3000 "npm --prefix web run dev"

echo "🎉 StartClaw is running"
echo "Frontend: http://localhost:3000"
echo "API:      http://localhost:3001"
