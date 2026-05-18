#!/bin/sh
set -e

echo "[start] Starting nginx-rtmp..."
nginx -c /etc/nginx/nginx.conf &

echo "[start] Starting relay management server..."
exec node /app/index.js
