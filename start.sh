#!/bin/bash

echo "🚀 Starting SiteMinder API Wrapper..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Build and start the container
echo "📦 Building Docker image..."
docker-compose build

echo "🏃 Starting container..."
docker-compose up -d

echo ""
echo "✅ SiteMinder API Wrapper is starting..."
echo ""
echo "Waiting for service to be ready..."
sleep 5

# Check health
echo ""
echo "🏥 Health Check:"
curl -s http://localhost:3001/health | jq '.' || echo "Service starting up..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Service URLs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Health Check:  http://localhost:3001/health"
echo "  Status:        http://localhost:3001/status"
echo "  OpenAPI Spec:  http://localhost:3001/openapi.json"
echo "  Swagger UI:    http://localhost:3001/api-docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
echo ""
