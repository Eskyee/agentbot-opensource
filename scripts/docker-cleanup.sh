#!/bin/bash
# Docker cleanup script

echo "🧹 Cleaning up Docker..."

# Stop and remove unused containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes
docker volume prune -f

# Remove unused networks
docker network prune -f

# Clean up build cache
docker builder prune -f

echo "✅ Docker cleanup complete!"
docker system df
