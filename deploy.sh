#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment to VPS..."

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

# Build and restart containers
echo "🏗️ Building and restarting containers..."
docker compose down
docker compose up -d --build

# Prune old images to save space
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment successful!"
echo "📡 Dashboard: http://localhost (via Port 80)"
echo "📡 API: http://localhost/api/v1 (via Port 80)"
