# PowerShell script for Windows - Quick start Docker

Write-Host "🐳 Starting TAPP Club API with Docker..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host ""
    Write-Host "📝 Please edit .env file with your actual credentials:" -ForegroundColor Yellow
    Write-Host "   - DATABASE_URL" -ForegroundColor White
    Write-Host "   - GEMINI_API_KEY" -ForegroundColor White
    Write-Host "   - GOOGLE_MAPS_API_KEY" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found .env file" -ForegroundColor Green
Write-Host ""

# Build and start
Write-Host "🔨 Building Docker image..." -ForegroundColor Cyan
docker-compose build

Write-Host ""
Write-Host "🚀 Starting containers..." -ForegroundColor Cyan
docker-compose up -d

Write-Host ""
Write-Host "✅ Containers started!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "🌐 API is available at:" -ForegroundColor Cyan
Write-Host "   - Main API: http://localhost:8000" -ForegroundColor White
Write-Host "   - API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "   - Health Check: http://localhost:8000/health" -ForegroundColor White
Write-Host ""
Write-Host "📋 Useful commands:" -ForegroundColor Cyan
Write-Host "   - View logs: docker-compose logs -f" -ForegroundColor White
Write-Host "   - Stop: docker-compose down" -ForegroundColor White
Write-Host "   - Restart: docker-compose restart" -ForegroundColor White
Write-Host ""
