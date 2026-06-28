#!/bin/bash

# Configuration
APP_DIR="github/backend"
PM2_NAME="patent-hash-backend"

echo "🚀 Starting deployment to OCI..."

# Navigate to app directory
cd $APP_DIR || { echo "❌ Error: Could not find directory $APP_DIR"; exit 1; }

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🛠 Building project..."
npm run build:prod

# Database migrations
echo "🗄 Running database migrations..."
npm run db:push

# Restart with PM2
echo "🔄 Restarting app with PM2..."
if pm2 list | grep -q "$PM2_NAME"; then
    pm2 restart ecosystem.config.cjs --env production
else
    pm2 start ecosystem.config.cjs --env production
fi

# Save PM2 list
pm2 save

echo "✅ Deployment complete! Check status with 'pm2 status'"
