# TeachAI Docker Management Script for Windows PowerShell
# This script provides easy commands to manage the TeachAI Docker environment

param(
    [Parameter(Position=0, Mandatory=$false)]
    [ValidateSet("dev", "prod", "stop", "restart", "logs", "build", "clean", "backup", "restore", "health", "scale", "shell", "update", "help")]
    [string]$Command = "help",
    
    [Parameter(Position=1, Mandatory=$false)]
    [string]$Service = "",
    
    [Parameter(Position=2, Mandatory=$false)]
    [string]$Count = "",
    
    [switch]$Build,
    [switch]$Pull,
    [switch]$NoCache,
    [switch]$Verbose
)

# Configuration
$ComposeFile = "docker-compose.yml"
$DevComposeFile = "docker-compose.dev.yml"
$ProdComposeFile = "docker-compose.prod.yml"

# Function to print colored output
function Write-ColoredOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Function to print usage
function Show-Usage {
    Write-Host "TeachAI Docker Management Script for Windows" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\docker-manage.ps1 [COMMAND] [OPTIONS]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  dev             Start development environment"
    Write-Host "  prod            Start production environment"
    Write-Host "  stop            Stop all services"
    Write-Host "  restart         Restart all services"
    Write-Host "  logs            View logs from all services"
    Write-Host "  build           Build all Docker images"
    Write-Host "  clean           Remove all containers, volumes, and images"
    Write-Host "  backup          Backup database and volumes"
    Write-Host "  restore         Restore database and volumes"
    Write-Host "  health          Check health of all services"
    Write-Host "  scale           Scale services (usage: scale [service] [count])"
    Write-Host "  shell           Open shell in a service container"
    Write-Host "  update          Update and rebuild services"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Build          Force rebuild of images"
    Write-Host "  -Pull           Pull latest base images"
    Write-Host "  -NoCache        Build without cache"
    Write-Host "  -Verbose        Verbose output"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\docker-manage.ps1 dev                    # Start development environment"
    Write-Host "  .\docker-manage.ps1 prod -Build            # Start production with rebuild"
    Write-Host "  .\docker-manage.ps1 logs backend           # View backend service logs"
    Write-Host "  .\docker-manage.ps1 scale backend 3        # Scale backend to 3 replicas"
    Write-Host "  .\docker-manage.ps1 shell backend          # Open shell in backend container"
}

# Function to check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        Write-ColoredOutput "Error: Docker is not running. Please start Docker Desktop first." "Red"
        exit 1
    }
}

# Function to check if required files exist
function Test-Requirements {
    if (-not (Test-Path $ComposeFile)) {
        Write-ColoredOutput "Error: docker-compose.yml not found!" "Red"
        exit 1
    }
    
    if (-not (Test-Path ".env") -and -not (Test-Path ".env.example")) {
        Write-ColoredOutput "Warning: No .env file found. Using defaults." "Yellow"
    }
}

# Function to create .env from example if it doesn't exist
function New-EnvFile {
    if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
        Write-ColoredOutput "Creating .env file from .env.example..." "Blue"
        Copy-Item ".env.example" ".env"
        Write-ColoredOutput "Please edit .env file with your configuration before continuing." "Yellow"
        Write-ColoredOutput "Press Enter to continue after editing .env file..."
        Read-Host
    }
}

# Function to start development environment
function Start-DevEnvironment {
    Write-ColoredOutput "Starting TeachAI Development Environment..." "Green"
    New-EnvFile
    
    $composeCommand = "docker-compose -f $ComposeFile -f $DevComposeFile"
    
    if ($Build) {
        Invoke-Expression "$composeCommand build"
    }
    
    if ($Pull) {
        Invoke-Expression "$composeCommand pull"
    }
    
    Invoke-Expression "$composeCommand up -d"
    
    Write-ColoredOutput "Development environment started successfully!" "Green"
    Write-ColoredOutput "Services available at:" "Blue"
    Write-ColoredOutput "  Frontend: http://localhost:3000" "Blue"
    Write-ColoredOutput "  Backend API: http://localhost:4000" "Blue"
    Write-ColoredOutput "  Flask AI: http://localhost:5000" "Blue"
    Write-ColoredOutput "  MongoDB: mongodb://localhost:27017" "Blue"
    Write-ColoredOutput "  Redis: redis://localhost:6379" "Blue"
    Write-ColoredOutput "  Mongo Express: http://localhost:8081" "Blue"
    Write-ColoredOutput "  Redis Commander: http://localhost:8082" "Blue"
}

# Function to start production environment
function Start-ProdEnvironment {
    Write-ColoredOutput "Starting TeachAI Production Environment..." "Green"
    New-EnvFile
    
    $composeCommand = "docker-compose -f $ComposeFile -f $ProdComposeFile"
    
    if ($Build) {
        Invoke-Expression "$composeCommand build"
    }
    
    if ($Pull) {
        Invoke-Expression "$composeCommand pull"
    }
    
    Invoke-Expression "$composeCommand up -d"
    
    Write-ColoredOutput "Production environment started successfully!" "Green"
    Write-ColoredOutput "Services available at:" "Blue"
    Write-ColoredOutput "  Application: http://localhost:80" "Blue"
    Write-ColoredOutput "  Monitoring: http://localhost:3001" "Blue"
}

# Function to stop services
function Stop-Services {
    Write-ColoredOutput "Stopping TeachAI services..." "Yellow"
    Invoke-Expression "docker-compose -f $ComposeFile -f $DevComposeFile -f $ProdComposeFile down"
    Write-ColoredOutput "All services stopped." "Green"
}

# Function to restart services
function Restart-Services {
    Write-ColoredOutput "Restarting TeachAI services..." "Yellow"
    Stop-Services
    Start-Sleep -Seconds 2
    
    # Check which environment was running
    $devRunning = docker-compose -f $DevComposeFile ps -q 2>$null
    if ($devRunning) {
        Start-DevEnvironment
    } else {
        Start-ProdEnvironment
    }
}

# Function to view logs
function Show-Logs {
    param([string]$ServiceName)
    
    if ($ServiceName) {
        Write-ColoredOutput "Showing logs for $ServiceName..." "Blue"
        Invoke-Expression "docker-compose logs -f $ServiceName"
    } else {
        Write-ColoredOutput "Showing logs for all services..." "Blue"
        Invoke-Expression "docker-compose logs -f"
    }
}

# Function to build images
function Build-Images {
    Write-ColoredOutput "Building TeachAI Docker images..." "Blue"
    
    $buildArgs = ""
    if ($NoCache) {
        $buildArgs = "--no-cache"
    }
    
    Invoke-Expression "docker-compose -f $ComposeFile build $buildArgs"
    Write-ColoredOutput "Build completed successfully!" "Green"
}

# Function to clean up
function Remove-All {
    Write-ColoredOutput "Warning: This will remove all TeachAI containers, volumes, and images!" "Red"
    $response = Read-Host "Are you sure? (y/N)"
    
    if ($response -match "^[Yy]$") {
        Write-ColoredOutput "Cleaning up..." "Yellow"
        
        # Stop and remove containers
        Invoke-Expression "docker-compose -f $ComposeFile -f $DevComposeFile -f $ProdComposeFile down -v --rmi all"
        
        # Remove dangling images
        Invoke-Expression "docker image prune -f"
        
        # Remove unused volumes
        Invoke-Expression "docker volume prune -f"
        
        Write-ColoredOutput "Cleanup completed!" "Green"
    } else {
        Write-ColoredOutput "Cleanup cancelled." "Blue"
    }
}

# Function to check health
function Test-Health {
    Write-ColoredOutput "Checking health of TeachAI services..." "Blue"
    Invoke-Expression "docker-compose ps"
    
    Write-ColoredOutput "`nDetailed health status:" "Blue"
    $services = @("mongodb", "redis", "backend", "flask-ai", "frontend")
    
    foreach ($service in $services) {
        $containerName = "teachai-$service"
        $running = docker ps --format "table {{.Names}}" | Select-String $containerName
        
        if ($running) {
            try {
                $healthStatus = docker inspect --format='{{.State.Health.Status}}' $containerName 2>$null
                if ($healthStatus -eq "healthy") {
                    Write-ColoredOutput "  $service`: ✓ Healthy" "Green"
                } elseif ($healthStatus -eq "unhealthy") {
                    Write-ColoredOutput "  $service`: ✗ Unhealthy" "Red"
                } else {
                    Write-ColoredOutput "  $service`: ? No health check" "Yellow"
                }
            } catch {
                Write-ColoredOutput "  $service`: ? No health check" "Yellow"
            }
        } else {
            Write-ColoredOutput "  $service`: ✗ Not running" "Red"
        }
    }
}

# Function to scale services
function Set-ServiceScale {
    param(
        [string]$ServiceName,
        [string]$ReplicaCount
    )
    
    if (-not $ServiceName -or -not $ReplicaCount) {
        Write-ColoredOutput "Usage: scale [service] [count]" "Red"
        exit 1
    }
    
    Write-ColoredOutput "Scaling $ServiceName to $ReplicaCount replicas..." "Blue"
    Invoke-Expression "docker-compose up -d --scale $ServiceName=$ReplicaCount"
    Write-ColoredOutput "Service scaled successfully!" "Green"
}

# Function to open shell in service
function Enter-ServiceShell {
    param([string]$ServiceName = "backend")
    
    $containerName = "teachai-$ServiceName"
    $running = docker ps --format "table {{.Names}}" | Select-String $containerName
    
    if ($running) {
        Write-ColoredOutput "Opening shell in $ServiceName container..." "Blue"
        Invoke-Expression "docker exec -it $containerName /bin/sh"
    } else {
        Write-ColoredOutput "Error: Container $containerName is not running!" "Red"
        exit 1
    }
}

# Function to backup data
function Backup-Data {
    Write-ColoredOutput "Creating backup of TeachAI data..." "Blue"
    
    $backupDir = "./backups/$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    # Backup MongoDB
    $mongoRunning = docker ps --format "table {{.Names}}" | Select-String "teachai-mongodb"
    if ($mongoRunning) {
        Write-ColoredOutput "Backing up MongoDB..." "Blue"
        Invoke-Expression "docker exec teachai-mongodb mongodump --out /tmp/backup"
        Invoke-Expression "docker cp teachai-mongodb:/tmp/backup $backupDir/mongodb"
    }
    
    # Backup volumes
    Write-ColoredOutput "Backing up Docker volumes..." "Blue"
    $currentDir = (Get-Location).Path.Replace('\', '/')
    Invoke-Expression "docker run --rm -v teachai_backend_uploads:/data -v `"${currentDir}/${backupDir}:/backup`" alpine tar czf /backup/backend_uploads.tar.gz -C /data ."
    Invoke-Expression "docker run --rm -v teachai_flask_data:/data -v `"${currentDir}/${backupDir}:/backup`" alpine tar czf /backup/flask_data.tar.gz -C /data ."
    
    Write-ColoredOutput "Backup completed: $backupDir" "Green"
}

# Function to restore data
function Restore-Data {
    param([string]$BackupDir)
    
    if (-not $BackupDir -or -not (Test-Path $BackupDir)) {
        Write-ColoredOutput "Usage: restore [backup_directory]" "Red"
        Write-ColoredOutput "Available backups:" "Blue"
        if (Test-Path "./backups/") {
            Get-ChildItem "./backups/" | Format-Table Name, LastWriteTime
        } else {
            Write-ColoredOutput "No backups found" "Yellow"
        }
        exit 1
    }
    
    Write-ColoredOutput "Restoring data from $BackupDir..." "Blue"
    Write-ColoredOutput "Warning: This will overwrite existing data!" "Red"
    $response = Read-Host "Continue? (y/N)"
    
    if ($response -match "^[Yy]$") {
        # Restore MongoDB
        if (Test-Path "$BackupDir/mongodb") {
            Invoke-Expression "docker cp $BackupDir/mongodb teachai-mongodb:/tmp/restore"
            Invoke-Expression "docker exec teachai-mongodb mongorestore --drop /tmp/restore"
        }
        
        # Restore volumes
        $currentDir = (Get-Location).Path.Replace('\', '/')
        if (Test-Path "$BackupDir/backend_uploads.tar.gz") {
            Invoke-Expression "docker run --rm -v teachai_backend_uploads:/data -v `"${currentDir}/${BackupDir}:/backup`" alpine tar xzf /backup/backend_uploads.tar.gz -C /data"
        }
        
        if (Test-Path "$BackupDir/flask_data.tar.gz") {
            Invoke-Expression "docker run --rm -v teachai_flask_data:/data -v `"${currentDir}/${BackupDir}:/backup`" alpine tar xzf /backup/flask_data.tar.gz -C /data"
        }
        
        Write-ColoredOutput "Restore completed!" "Green"
    } else {
        Write-ColoredOutput "Restore cancelled." "Blue"
    }
}

# Function to update services
function Update-Services {
    Write-ColoredOutput "Updating TeachAI services..." "Blue"
    
    # Pull latest base images
    Invoke-Expression "docker-compose pull"
    
    # Rebuild services
    Invoke-Expression "docker-compose build --pull"
    
    # Restart services
    Invoke-Expression "docker-compose up -d"
    
    Write-ColoredOutput "Update completed!" "Green"
}

# Main execution
if ($Verbose) {
    $VerbosePreference = "Continue"
}

# Check requirements
Test-Docker
Test-Requirements

# Execute command
switch ($Command.ToLower()) {
    "dev" { Start-DevEnvironment }
    "prod" { Start-ProdEnvironment }
    "stop" { Stop-Services }
    "restart" { Restart-Services }
    "logs" { Show-Logs -ServiceName $Service }
    "build" { Build-Images }
    "clean" { Remove-All }
    "backup" { Backup-Data }
    "restore" { Restore-Data -BackupDir $Service }
    "health" { Test-Health }
    "scale" { Set-ServiceScale -ServiceName $Service -ReplicaCount $Count }
    "shell" { Enter-ServiceShell -ServiceName $Service }
    "update" { Update-Services }
    "help" { Show-Usage }
    default {
        Write-ColoredOutput "Error: Unknown command '$Command'" "Red"
        Show-Usage
        exit 1
    }
}