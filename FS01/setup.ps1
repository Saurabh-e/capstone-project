# Multi-Vendor E-Commerce Marketplace Setup Script
# PowerShell script for Windows

Write-Host "🚀 Multi-Vendor E-Commerce Marketplace Setup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check Docker
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker not found. You can still run manually without Docker." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Setting up Backend..." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan

# Backend setup
Set-Location backend

if (!(Test-Path ".env")) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Please edit backend/.env with your credentials!" -ForegroundColor Yellow
}

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Backend installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma client generated" -ForegroundColor Green
} else {
    Write-Host "❌ Prisma generation failed" -ForegroundColor Red
}

Set-Location ..

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Setting up Frontend..." -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan

# Frontend setup
Set-Location frontend

if (!(Test-Path ".env")) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
}

Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend installation failed" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Setup Complete! 🎉" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configure environment variables:" -ForegroundColor White
Write-Host "   - Edit backend/.env with your database, Redis, AWS, Stripe credentials" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start services with Docker:" -ForegroundColor White
Write-Host "   docker-compose up -d" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Run database migrations:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   npx prisma migrate dev --name init" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Start development servers:" -ForegroundColor White
Write-Host "   Backend:  cd backend && npm run dev" -ForegroundColor Cyan
Write-Host "   Frontend: cd frontend && npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Access the application:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "   API Docs: See docs/api-documentation.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "For more information, see README.md and IMPLEMENTATION_GUIDE.md" -ForegroundColor Gray
Write-Host ""
