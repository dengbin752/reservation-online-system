#!/bin/bash

# Wait for Couchbase to be ready
# Usage: wait-for-couchbase [docker-compose-file] [max-attempts] [sleep-time]

DOCKER_COMPOSE_FILE=${1:-"docker-compose.yml"}
MAX_ATTEMPTS=${2:-30}
SLEEP_TIME=${3:-5}

echo "⏳ Waiting for Couchbase to be ready..."
attempt=0

while [ $attempt -lt $MAX_ATTEMPTS ]; do
    if docker compose -f "$DOCKER_COMPOSE_FILE" exec couchbase cbq -u Administrator -p password --script "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Couchbase is ready!"
        exit 0
    fi
    
    attempt=$((attempt + 1))
    echo "⏳ Waiting for Couchbase... ($attempt/$MAX_ATTEMPTS)"
    sleep $SLEEP_TIME
done

echo "❌ Couchbase failed to start within expected time. Continuing anyway..."
exit 1