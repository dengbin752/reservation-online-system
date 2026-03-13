#!/bin/bash

# Get the directory where this script is located
export SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Hotel Reservation System"
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Show available options
echo ""
echo "📋 Available startup options:"
echo "1. Start all services (development mode)"
echo "2. Initialize Couchbase only"
echo "3. Stop all services"
echo "4. View service status"
echo "5. Exit"
echo ""

# Read user choice
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🚀 Starting all services..."
        
        # Start Couchbase first
        echo "📊 Starting Couchbase..."
        docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" up -d couchbase
        
        # Initialize Couchbase
        echo "📊 Initializing Couchbase database..."
        "$SCRIPT_DIR/utils/init-couchbase-for-dev.sh" "$PROJECT_ROOT/docker-compose.dev.yml"
        
        # Start API service
        echo "🔧 Starting API service..."
        docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" up -d api
        
        # Wait for API to be ready
        echo "⏳ Waiting for API to be ready..."
        for i in {1..30}; do
            if curl -s http://localhost:3000/health > /dev/null 2>&1; then
                echo "✅ API is ready!"
                break
            fi
            if [ $i -eq 30 ]; then
                echo "❌ API failed to start. Please check the logs."
                exit 1
            fi
            sleep 2
        done
        
        # Start customer UI
        echo "🎨 Starting Customer UI..."
        docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" up -d customer-ui
        
        # Start admin UI
        echo "👨‍💼 Starting Admin UI..."
        docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" up -d admin-ui
        
        # Create admin user if not exists
        echo "👤 Creating admin user..."
        sleep 5
        ADMIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/auth/register \
            -H "Content-Type: application/json" \
            -d '{"email":"admin@hotel.com","password":"admin123","firstName":"Admin","lastName":"User","role":"ADMIN"}' 2>&1)
        
        HTTP_CODE=$(echo "$ADMIN_RESPONSE" | tail -n1)
        RESPONSE_BODY=$(echo "$ADMIN_RESPONSE" | sed '$d')
        
        if [ "$HTTP_CODE" = "201" ]; then
            echo "✅ Admin user created successfully"
        elif echo "$RESPONSE_BODY" | grep -q "User already exists"; then
            echo "✅ Admin user already exists"
        elif [ "$HTTP_CODE" = "409" ]; then
            echo "✅ Admin user already exists"
        else
            echo "⚠️  Admin user creation response: $RESPONSE_BODY"
        fi
        
        # Display status
        echo ""
        echo "✅ All services started successfully!"
        echo "========================================"
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
        echo "========================================"
        ;;
    2)
        echo "📊 Initializing Couchbase..."
        
        # Start Couchbase
        docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" up -d couchbase
        
        # Initialize Couchbase
        "$SCRIPT_DIR/utils/init-couchbase-for-dev.sh" "$PROJECT_ROOT/docker-compose.dev.yml"
        
        echo "✅ Couchbase initialization completed!"
        ;;
    3)
        echo "🛑 Stopping all services..."
        docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" down
        echo "✅ All services stopped!"
        ;;
    4)
        echo "📊 Service Status:"
        docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" ps
        ;;
    5)
        echo "👋 Exiting..."
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac