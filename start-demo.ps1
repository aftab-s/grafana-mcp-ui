# Grafana MCP Demo - Startup Script for Windows
# Run this with: .\start-demo.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Grafana MCP Demo - Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not installed or not running!" -ForegroundColor Red
    Write-Host "  Please install Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Check if Docker daemon is running
try {
    docker ps | Out-Null
    Write-Host "✓ Docker daemon is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker daemon is not running!" -ForegroundColor Red
    Write-Host "  Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Check if ports are available
Write-Host ""
Write-Host "Checking required ports..." -ForegroundColor Yellow

$requiredPorts = @(3000, 3001, 8080, 8081, 9090, 9115, 3100)
$portsInUse = @()

foreach ($port in $requiredPorts) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $portsInUse += $port
        Write-Host "✗ Port $port is already in use" -ForegroundColor Red
    } else {
        Write-Host "✓ Port $port is available" -ForegroundColor Green
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host ""
    Write-Host "Warning: Some required ports are in use!" -ForegroundColor Red
    Write-Host "You may need to stop other services or modify docker-compose.yml" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Startup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Create logs directory if it doesn't exist
Write-Host ""
Write-Host "Creating logs directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
Write-Host "✓ Logs directory ready" -ForegroundColor Green

# Check if containers are already running
Write-Host ""
Write-Host "Checking for existing containers..." -ForegroundColor Yellow
$existingContainers = docker-compose ps -q
if ($existingContainers) {
    Write-Host "Found existing containers." -ForegroundColor Yellow
    $restart = Read-Host "Restart existing containers? (Y/n)"
    if ($restart -eq "n" -or $restart -eq "N") {
        Write-Host "Keeping existing containers." -ForegroundColor Green
    } else {
        Write-Host "Restarting containers..." -ForegroundColor Yellow
        docker-compose restart
        Write-Host "✓ Containers restarted" -ForegroundColor Green
    }
} else {
    # Start all services
    Write-Host ""
    Write-Host "Starting all services..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes on first run..." -ForegroundColor Cyan
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ All services started successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to start services!" -ForegroundColor Red
        Write-Host "  Check the error messages above." -ForegroundColor Red
        exit 1
    }
}

# Wait for services to be healthy
Write-Host ""
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Write-Host "(This may take 30-60 seconds)" -ForegroundColor Cyan

$maxAttempts = 30
$attempt = 0
$grafanaReady = $false

while ($attempt -lt $maxAttempts -and -not $grafanaReady) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $grafanaReady = $true
        }
    } catch {
        # Service not ready yet
    }
    $attempt++
    Write-Host "." -NoNewline -ForegroundColor Cyan
}

Write-Host ""

if ($grafanaReady) {
    Write-Host "✓ Grafana is ready!" -ForegroundColor Green
} else {
    Write-Host "⚠ Grafana is taking longer than expected to start" -ForegroundColor Yellow
    Write-Host "  You can check status with: docker-compose logs grafana" -ForegroundColor Yellow
}

# Display status
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Service Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
docker-compose ps

# Display access information
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Access Information" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Conversational UI:  " -NoNewline -ForegroundColor White
Write-Host "http://localhost:8080" -ForegroundColor Green
Write-Host "Grafana:           " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3000 (admin/admin)" -ForegroundColor Green
Write-Host "Prometheus:        " -NoNewline -ForegroundColor White
Write-Host "http://localhost:9090" -ForegroundColor Green
Write-Host "Demo App:          " -NoNewline -ForegroundColor White
Write-Host "http://localhost:8081" -ForegroundColor Green
Write-Host ""

# Offer to open browser
$openBrowser = Read-Host "Open Conversational UI in browser? (Y/n)"
if ($openBrowser -ne "n" -and $openBrowser -ne "N") {
    Start-Process "http://localhost:8080"
    Write-Host "✓ Browser opened" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Quick Commands" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "View logs:         " -NoNewline -ForegroundColor White
Write-Host "docker-compose logs -f" -ForegroundColor Cyan
Write-Host "Stop services:     " -NoNewline -ForegroundColor White
Write-Host "docker-compose stop" -ForegroundColor Cyan
Write-Host "Restart services:  " -NoNewline -ForegroundColor White
Write-Host "docker-compose restart" -ForegroundColor Cyan
Write-Host "Remove all:        " -NoNewline -ForegroundColor White
Write-Host "docker-compose down -v" -ForegroundColor Cyan
Write-Host ""
Write-Host "Generate load:     " -NoNewline -ForegroundColor White
Write-Host 'curl "http://localhost:8081/simulate/load?pattern=spike"' -ForegroundColor Cyan
Write-Host ""

Write-Host "Demo is ready! 🎉" -ForegroundColor Green
Write-Host ""
