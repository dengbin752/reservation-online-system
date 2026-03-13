#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Development Startup Script
# This script starts the entire Hotel Reservation system

echo "🚀 Starting Hotel Reservation System"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if required files exist
if [ ! -f "$PROJECT_ROOT/docker-compose.dev.yml" ]; then
    echo "❌ docker-compose.dev.yml not found. Please run this script from the project root."
    exit 1
fi

# Start services
echo "🐳 Starting Docker containers..."
docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" up -d couchbase

# Initialize Couchbase
echo "📊 Initializing Couchbase database..."
"$SCRIPT_DIR/utils/init-couchbase-for-dev.sh" "$PROJECT_ROOT/docker-compose.dev.yml"

# Start API service
echo "🔧 Starting API service..."
docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" up -d api

# Wait for API to be ready with Couchbase connection check
echo "⏳ Waiting for API to be ready..."
API_READY=false
for i in {1..60}; do
    # Check API health endpoint which now includes Couchbase connection check
    HEALTH_RESPONSE=$(curl -s http://localhost:3000/health 2>&1)

    if echo "$HEALTH_RESPONSE" | grep -q '"status":"OK"' && echo "$HEALTH_RESPONSE" | grep -q '"database":"connected"'; then
        echo "✅ API is ready and connected to Couchbase!"
        API_READY=true
        break
    fi

    if [ $i -eq 60 ]; then
        echo "❌ API failed to start or connect to Couchbase."
        echo "   Health response: $HEALTH_RESPONSE"
        echo "   Please check the logs: docker logs reservation-api-dev"
        exit 1
    fi

    echo "   Waiting for API... ($i/60)"
    sleep 2
done

# Start customer UI
echo "🎨 Starting Customer UI..."
docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" up -d customer-ui

# Start admin UI
echo "👨‍💼 Starting Admin UI..."
docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" up -d admin-ui

# Create admin user if not exists with retry logic
echo "👤 Creating admin user..."

ADMIN_CREATED=false
MAX_RETRIES=5
RETRY_DELAY=3

for attempt in $(seq 1 $MAX_RETRIES); do
    echo "   Attempt $attempt of $MAX_RETRIES..."

    ADMIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/auth/register \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@hotel.com","password":"admin123","firstName":"Admin","lastName":"User","role":"admin"}' 2>&1)

    # Extract HTTP status code (last line)
    HTTP_CODE=$(echo "$ADMIN_RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$ADMIN_RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "201" ]; then
        echo "✅ Admin user created successfully"
        ADMIN_CREATED=true
        break
    elif echo "$RESPONSE_BODY" | grep -q "User already exists"; then
        echo "✅ Admin user already exists"
        ADMIN_CREATED=true
        break
    elif [ "$HTTP_CODE" = "409" ]; then
        echo "✅ Admin user already exists"
        ADMIN_CREATED=true
        break
    else
        echo "⚠️  Attempt $attempt failed: HTTP $HTTP_CODE - $RESPONSE_BODY"
        if [ $attempt -lt $MAX_RETRIES ]; then
            echo "   Retrying in $RETRY_DELAY seconds..."
            sleep $RETRY_DELAY
        fi
    fi
done

if [ "$ADMIN_CREATED" = false ]; then
    echo "❌ Failed to create admin user after $MAX_RETRIES attempts"
fi

# Display status
echo ""
echo "✅ All services started successfully!"
echo "=================================================="
echo "🌐 Customer Interface: http://localhost:3001"
echo "👨‍💼 Admin Interface: http://localhost:3002"
echo "🔌 API Health Check: http://localhost:3000/health"
echo "🔌 GraphQL Endpoint: http://localhost:3000/api/graphql"
echo "📊 Couchbase Web Console: http://localhost:8091"
echo ""
echo "🔐 Default Credentials:"
echo "   Couchbase:"
echo "      Username: Administrator"
echo "      Password: password"
echo ""
echo "   Admin Account:"
echo "      Email: admin@hotel.com"
echo "      Password: admin123"
echo ""
echo "=================================================="
