#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment to VPS..."

# Git pulling removed to prevent further conflicts during stabilization
# echo "📥 Pulling latest changes from git..."
# git stash
# git pull origin main
# git stash pop || true

# Build and restart containers
echo "🏗️ Building and restarting containers..."
docker compose down
docker compose up -d --build

# Wait for container to be running
echo "⏳ Waiting for app container to be ready..."
for i in {1..12}; do
  STATUS=$(docker inspect -f '{{.State.Status}}' business-data-app-1 2>/dev/null || echo "not found")
  if [ "$STATUS" = "running" ]; then
    echo "✅ App container is running."
    break
  fi
  echo "📡 Container status: $STATUS, waiting... ($i/12)"
  sleep 5
done

# Run database migrations with retry logic
echo "🗄️ Syncing database schema..."
MAX_RETRIES=5
RETRY_COUNT=0
SUCCESS=false

until [ $RETRY_COUNT -ge $MAX_RETRIES ]
do
  # Ensure container is running before trying to exec
  STATUS=$(docker inspect -f '{{.State.Status}}' business-data-app-1 2>/dev/null || echo "not found")
  if [ "$STATUS" != "running" ]; then
    echo "⚠️ Container status is $STATUS, waiting... ($((RETRY_COUNT+1))/$MAX_RETRIES)"
    sleep 5
    RETRY_COUNT=$((RETRY_COUNT+1))
    continue
  fi

  if docker compose exec -T app npx prisma db push --accept-data-loss; then
    SUCCESS=true
    break
  else
    echo "⚠️ Database not ready yet, retrying in 5 seconds... ($((RETRY_COUNT+1))/$MAX_RETRIES)"
    sleep 5
    RETRY_COUNT=$((RETRY_COUNT+1))
  fi
done

if [ "$SUCCESS" = false ]; then
  echo "❌ Database sync failed after $MAX_RETRIES attempts."
  exit 1
fi

# Prune old images to save space
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment successful!"
echo "📡 Dashboard: http://65.20.90.180:8081"
echo "📡 API: http://65.20.90.180:3001/api/v1"
