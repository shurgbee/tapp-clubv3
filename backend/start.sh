#!/bin/bash
# Quick start script for Docker

echo "🐳 Starting TAPP Club API with Docker..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "📝 Please edit .env file with your actual credentials:"
    echo "   - DATABASE_URL"
    echo "   - GEMINI_API_KEY"
    echo "   - GOOGLE_MAPS_API_KEY"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ Found .env file"
echo ""

# Build and start
echo "🔨 Building Docker image..."
docker-compose build

echo ""
echo "🚀 Starting containers..."
docker-compose up -d

echo ""
echo "✅ Containers started!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 API is available at:"
echo "   - Main API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo "   - Health Check: http://localhost:8000/health"
echo ""
echo "📋 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop: docker-compose down"
echo "   - Restart: docker-compose restart"
echo ""
