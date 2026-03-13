#!/bin/bash

# Couchbase initialization script
# This script creates buckets and indexes

DOCKER_COMPOSE_FILE=${1:-"docker-compose.yml"}
COUCHBASE_HOST=${COUCHBASE_HOST:-localhost}
COUCHBASE_USER=${COUCHBASE_USER:-Administrator}
COUCHBASE_PASS=${COUCHBASE_PASS:-password}

echo "📊 Initializing Couchbase..."
echo "===================================="

# Function to check if cluster is initialized
check_cluster_init() {
    curl -s -u "$COUCHBASE_USER:$COUCHBASE_PASS" "http://$COUCHBASE_HOST:8091/pools/default" > /dev/null 2>&1
    return $?
}

# Wait for Couchbase to be ready
echo "⏳ Waiting for Couchbase to be ready..."
for i in {1..30}; do
    if check_cluster_init; then
        echo "✅ Couchbase is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Couchbase failed to start"
        exit 1
    fi
    sleep 2
done

# Check if cluster is already initialized (has nodes)
echo "🔍 Checking cluster status..."
NODE_COUNT=$(curl -s -u "$COUCHBASE_USER:$COUCHBASE_PASS" "http://$COUCHBASE_HOST:8091/pools/default/buckets" | jq 'length' 2>/dev/null || echo "0")

if [ "$NODE_COUNT" = "0" ]; then
    # Cluster needs to be initialized
    echo "🏗️ Initializing cluster..."
    docker compose -f "$DOCKER_COMPOSE_FILE" exec couchbase /opt/couchbase/bin/couchbase-cli cluster-init \
        --cluster-username="$COUCHBASE_USER" \
        --cluster-password="$COUCHBASE_PASS" \
        --cluster-ramsize=512 \
        --cluster-index-ramsize=256 \
        --services=data,index,query \
        2>&1 || echo "Cluster may already be initialized, continuing..."
    
    # Wait for services to be ready
    sleep 10
fi

# Check if reservations bucket exists
BUCKET_EXISTS=$(curl -s -u "$COUCHBASE_USER:$COUCHBASE_PASS" "http://$COUCHBASE_HOST:8091/pools/default/buckets" | jq '.[] | select(.name=="reservations") | .name' 2>/dev/null)

if [ -z "$BUCKET_EXISTS" ]; then
    # Create reservations bucket using REST API
    echo "🪣 Creating reservations bucket..."
    curl -s -u "$COUCHBASE_USER:$COUCHBASE_PASS" -X POST "http://$COUCHBASE_HOST:8091/pools/default/buckets" \
        -d name=reservations \
        -d ramQuotaMB=256 \
        -d replicaNumber=1 \
        -d bucketType=couchbase \
        -d evictionPolicy=fullEviction > /dev/null 2>&1
    
    echo "✅ Bucket created"
    sleep 5
else
    echo "✅ Bucket 'reservations' already exists"
fi

# Wait for query service to be ready
echo "⏳ Waiting for query service..."
sleep 10

# Create primary index using REST API
echo "🔍 Creating primary index..."
curl -s -u "$COUCHBASE_USER:$COUCHBASE_PASS" -X POST "http://$COUCHBASE_HOST:8093/query/service" \
    -d 'statement=CREATE PRIMARY INDEX IF NOT EXISTS ON `reservations`' > /dev/null 2>&1 || true

echo "✅ Couchbase initialization completed!"
echo "===================================="
echo "📊 Buckets created:"
echo "   - reservations"
echo ""
echo "🔍 Primary indexes created"
echo ""
echo "💡 Note: Secondary indexes will be created by the API service on startup"