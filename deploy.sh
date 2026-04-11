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

# Run database migrations with retry logic
echo "🗄️ Syncing database schema..."
MAX_RETRIES=5
RETRY_COUNT=0
SUCCESS=false

until [ $RETRY_COUNT -ge $MAX_RETRIES ]
do
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
echo "📡 Dashboard: http://localhost:8080"
echo "📡 API: http://localhost:8080/api/v1"
