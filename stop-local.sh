#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

echo "🛑 Stopping Agentbot"

if [ -d .run ]; then
  for pidfile in .run/*.pid; do
    [ -f "$pidfile" ] || continue
    pid=$(cat "$pidfile" 2>/dev/null || true)
    if [ -n "${pid:-}" ] && kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
      echo "✅ Stopped process $pid from $(basename "$pidfile")"
    fi
    rm -f "$pidfile"
  done
fi

for port in 3000 3001; do
  port_pids=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "${port_pids:-}" ]; then
    for pid in $port_pids; do
      cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1 || true)
      if [[ -n "${cwd:-}" && "$cwd" == "$PWD"* ]]; then
        kill "$pid" >/dev/null 2>&1 || true
        echo "✅ Stopped workspace listener $pid on :$port"
      fi
    done
  fi
done

if docker info >/dev/null 2>&1; then
  docker compose down >/dev/null 2>&1 || true
fi

echo "✅ Agentbot stopped"
