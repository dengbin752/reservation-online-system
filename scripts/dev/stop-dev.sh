#!/bin/bash

# Development Stop Script
# This script stops the entire Hotel Reservation system

echo "🛑 Stopping Hotel Reservation System"
echo "=================================================="

# Stop all Docker containers
echo "🐳 Stopping Docker containers..."
docker compose -f docker-compose.dev.yml stop

# Remove containers (optional)
read -p "🗑️  Remove containers? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker compose -f docker-compose.dev.yml down -v
    echo "🗑️  Containers and volumes removed."
fi

echo "✅ All services stopped successfully!"
echo "=================================================="