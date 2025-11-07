# Heroku Deployment Script for Windows PowerShell
# Timesheet Management System
# Usage: .\deploy-to-heroku.ps1 [app-name]

param(
    [string]$AppName = ""
)

# Enable strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║   Heroku Deployment - Timesheet Management System        ║" -ForegroundColor Blue
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Check if Heroku CLI is installed
try {
    $herokuVersion = heroku --version
    Write-Host "✅ Heroku CLI found: $herokuVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Heroku CLI not found!" -ForegroundColor Red
    Write-Host "Please install Heroku CLI from: https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Yellow
    exit 1
}

# Get app name
if ([string]::IsNullOrEmpty($AppName)) {
    $AppName = Read-Host "Enter Heroku app name"
}

Write-Host "📱 App Name: $AppName" -ForegroundColor Blue

# Check if app exists
try {
    heroku apps:info -a $AppName 2>&1 | Out-Null
    Write-Host "⚠️  App '$AppName' already exists" -ForegroundColor Yellow
    $continue = Read-Host "Deploy to existing app? (y/n)"
    if ($continue -ne 'y') {
        Write-Host "❌ Deployment cancelled" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "🆕 Creating new Heroku app..." -ForegroundColor Blue
    heroku create $AppName
    Write-Host "✅ App created" -ForegroundColor Green
}

# Set stack to container
Write-Host "🐳 Setting stack to container..." -ForegroundColor Blue
heroku stack:set container -a $AppName

# Read environment variables from backend/.env
$envFile = "backend\.env"
$mongoUri = ""
$smtpUser = ""
$smtpPassword = ""
$smtpFromEmail = ""

if (Test-Path $envFile) {
    Write-Host "📖 Reading configuration from .env..." -ForegroundColor Blue
    $envContent = Get-Content $envFile
    
    foreach ($line in $envContent) {
        if ($line -match "^MONGODB_URI=(.+)$") {
            $mongoUri = $matches[1].Trim('"').Trim("'")
        }
        if ($line -match "^SMTP_USER=(.+)$") {
            $smtpUser = $matches[1].Trim('"').Trim("'")
        }
        if ($line -match "^SMTP_PASSWORD=(.+)$") {
            $smtpPassword = $matches[1].Trim('"').Trim("'")
        }
        if ($line -match "^SMTP_FROM_EMAIL=(.+)$") {
            $smtpFromEmail = $matches[1].Trim('"').Trim("'")
        }
    }
}

# Generate JWT secrets
Write-Host "🔑 Generating JWT secrets..." -ForegroundColor Blue
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$jwtRefreshSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Set config vars
Write-Host "🔧 Setting environment variables..." -ForegroundColor Yellow

# Core configuration
heroku config:set NODE_ENV=production -a $AppName
heroku config:set JWT_SECRET=$jwtSecret -a $AppName
heroku config:set JWT_REFRESH_SECRET=$jwtRefreshSecret -a $AppName
heroku config:set JWT_ACCESS_EXPIRY=15m -a $AppName
heroku config:set JWT_REFRESH_EXPIRY=7d -a $AppName
heroku config:set API_VERSION=v1 -a $AppName
heroku config:set USE_TRANSACTIONS=false -a $AppName

# MongoDB URI
if ($mongoUri) {
    heroku config:set MONGODB_URI=$mongoUri -a $AppName
    Write-Host "✅ MongoDB URI configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  MongoDB URI not found in .env" -ForegroundColor Yellow
    $mongoUri = Read-Host "Enter MongoDB Atlas URI"
    heroku config:set MONGODB_URI=$mongoUri -a $AppName
}

# SMTP Configuration
if ($smtpUser) {
    heroku config:set SMTP_HOST=smtp.gmail.com -a $AppName
    heroku config:set SMTP_PORT=587 -a $AppName
    heroku config:set SMTP_USER=$smtpUser -a $AppName
    heroku config:set SMTP_PASSWORD=$smtpPassword -a $AppName
    heroku config:set SMTP_FROM_EMAIL=$smtpFromEmail -a $AppName
    Write-Host "✅ SMTP configured" -ForegroundColor Green
}

# CORS and URLs
$appUrl = "https://$AppName.herokuapp.com"
heroku config:set CORS_ORIGIN=$appUrl -a $AppName
heroku config:set FRONTEND_URL=$appUrl -a $AppName

# Frontend build variables
heroku config:set VITE_API_URL="$appUrl/api" -a $AppName

Write-Host "✅ Environment variables configured" -ForegroundColor Green

# Add Heroku remote if not exists
$remotes = git remote
if ($remotes -notcontains "heroku") {
    Write-Host "🔗 Adding Heroku remote..." -ForegroundColor Blue
    heroku git:remote -a $AppName
} else {
    Write-Host "⚠️  Heroku remote already exists" -ForegroundColor Yellow
}

# Display current config
Write-Host "`n📋 Current configuration:" -ForegroundColor Blue
heroku config -a $AppName

# MongoDB Atlas reminder
Write-Host "`n⚠️  IMPORTANT: MongoDB Atlas Network Access" -ForegroundColor Yellow
Write-Host "Make sure to add 0.0.0.0/0 to MongoDB Atlas Network Access whitelist" -ForegroundColor Yellow
Write-Host "URL: https://cloud.mongodb.com" -ForegroundColor Cyan

# Ask for deployment confirmation
Write-Host ""
$deploy = Read-Host "Deploy to Heroku now? (y/n)"
if ($deploy -ne 'y') {
    Write-Host "⏸️  Deployment paused. Run 'git push heroku main' when ready." -ForegroundColor Yellow
    exit 0
}

# Check current branch
$currentBranch = git branch --show-current
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Blue

# Deploy
Write-Host "🚀 Deploying to Heroku..." -ForegroundColor Blue
try {
    if ($currentBranch -eq "main") {
        git push heroku main
    } else {
        Write-Host "⚠️  Not on 'main' branch. Pushing $currentBranch to Heroku main..." -ForegroundColor Yellow
        git push heroku "${currentBranch}:main"
    }
} catch {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Check deployment status
Write-Host "`n📊 Checking deployment status..." -ForegroundColor Blue
heroku ps -a $AppName

# Success message
Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 App URL: $appUrl" -ForegroundColor Cyan

# Open app
$openApp = Read-Host "Open app in browser? (y/n)"
if ($openApp -eq 'y') {
    heroku open -a $AppName
}

# Show logs
$showLogs = Read-Host "Show live logs? (y/n)"
if ($showLogs -eq 'y') {
    Write-Host "📝 Showing logs (Ctrl+C to exit):" -ForegroundColor Blue
    heroku logs --tail -a $AppName
}

Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "📚 Next steps:" -ForegroundColor Blue
Write-Host "  1. Test your application at: $appUrl" -ForegroundColor White
Write-Host "  2. Check logs: heroku logs --tail -a $AppName" -ForegroundColor White
Write-Host "  3. Monitor: https://dashboard.heroku.com/apps/$AppName" -ForegroundColor White
