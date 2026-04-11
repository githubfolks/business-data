#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment to VPS..."

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git stash
git pull origin main
git stash pop || true

# Build and restart containers
echo "🏗️ Building and restarting containers..."
docker compose down
docker compose up -d --build

# Run database migrations
echo "🗄️ Syncing database schema..."
docker compose exec -T app npx prisma db push --accept-data-loss

# Prune old images to save space
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment successful!"
echo "📡 Dashboard: http://localhost:8080"
echo "📡 API: http://localhost:8080/api/v1"
