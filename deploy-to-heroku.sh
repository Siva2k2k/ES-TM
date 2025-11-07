#!/bin/bash

# Heroku Deployment Script for Timesheet Management System
# Usage: ./deploy-to-heroku.sh [app-name]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Heroku Deployment - Timesheet Management System        ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo -e "${RED}❌ Heroku CLI not found!${NC}"
    echo -e "${YELLOW}Please install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Heroku CLI found${NC}"

# Get app name
APP_NAME=${1:-""}

if [ -z "$APP_NAME" ]; then
    read -p "Enter Heroku app name: " APP_NAME
fi

echo -e "${BLUE}📱 App Name: ${APP_NAME}${NC}"

# Check if app exists
if heroku apps:info -a "$APP_NAME" &> /dev/null; then
    echo -e "${YELLOW}⚠️  App '$APP_NAME' already exists${NC}"
    read -p "Deploy to existing app? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
else
    echo -e "${BLUE}🆕 Creating new Heroku app...${NC}"
    heroku create "$APP_NAME"
    echo -e "${GREEN}✅ App created${NC}"
fi

# Set stack to container
echo -e "${BLUE}🐳 Setting stack to container...${NC}"
heroku stack:set container -a "$APP_NAME"

# Set environment variables
echo -e "${BLUE}🔧 Setting environment variables...${NC}"

# Read MongoDB URI from .env
if [ -f backend/.env ]; then
    MONGODB_URI=$(grep "^MONGODB_URI=" backend/.env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    SMTP_USER=$(grep "^SMTP_USER=" backend/.env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    SMTP_PASSWORD=$(grep "^SMTP_PASSWORD=" backend/.env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    SMTP_FROM_EMAIL=$(grep "^SMTP_FROM_EMAIL=" backend/.env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

# Generate JWT secrets if not provided
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Set config vars
echo -e "${YELLOW}Setting configuration variables...${NC}"

heroku config:set \
    NODE_ENV=production \
    JWT_SECRET="$JWT_SECRET" \
    JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
    JWT_ACCESS_EXPIRY=15m \
    JWT_REFRESH_EXPIRY=7d \
    API_VERSION=v1 \
    USE_TRANSACTIONS=false \
    -a "$APP_NAME"

# Set MongoDB URI if available
if [ -n "$MONGODB_URI" ]; then
    heroku config:set MONGODB_URI="$MONGODB_URI" -a "$APP_NAME"
    echo -e "${GREEN}✅ MongoDB URI configured${NC}"
else
    echo -e "${RED}⚠️  MongoDB URI not found in .env${NC}"
    read -p "Enter MongoDB Atlas URI: " MONGODB_URI_INPUT
    heroku config:set MONGODB_URI="$MONGODB_URI_INPUT" -a "$APP_NAME"
fi

# Set SMTP if available
if [ -n "$SMTP_USER" ]; then
    heroku config:set \
        SMTP_HOST=smtp.gmail.com \
        SMTP_PORT=587 \
        SMTP_USER="$SMTP_USER" \
        SMTP_PASSWORD="$SMTP_PASSWORD" \
        SMTP_FROM_EMAIL="$SMTP_FROM_EMAIL" \
        -a "$APP_NAME"
    echo -e "${GREEN}✅ SMTP configured${NC}"
fi

# Set CORS and Frontend URL
heroku config:set \
    CORS_ORIGIN="https://$APP_NAME.herokuapp.com" \
    FRONTEND_URL="https://$APP_NAME.herokuapp.com" \
    -a "$APP_NAME"

# Set frontend build variables
heroku config:set \
    VITE_API_URL="https://$APP_NAME.herokuapp.com/api" \
    -a "$APP_NAME"

echo -e "${GREEN}✅ Environment variables configured${NC}"

# Add Heroku remote if not exists
if ! git remote | grep -q "heroku"; then
    echo -e "${BLUE}🔗 Adding Heroku remote...${NC}"
    heroku git:remote -a "$APP_NAME"
else
    echo -e "${YELLOW}⚠️  Heroku remote already exists${NC}"
fi

# Display current config
echo -e "${BLUE}📋 Current configuration:${NC}"
heroku config -a "$APP_NAME"

# Ask for deployment confirmation
echo ""
read -p "Deploy to Heroku now? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏸️  Deployment paused. Run 'git push heroku main' when ready.${NC}"
    exit 0
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 Current branch: ${CURRENT_BRANCH}${NC}"

# Deploy
echo -e "${BLUE}🚀 Deploying to Heroku...${NC}"
if [ "$CURRENT_BRANCH" = "main" ]; then
    git push heroku main
else
    echo -e "${YELLOW}⚠️  Not on 'main' branch. Pushing ${CURRENT_BRANCH} to Heroku main...${NC}"
    git push heroku "$CURRENT_BRANCH:main"
fi

# Check deployment status
echo -e "${BLUE}📊 Checking deployment status...${NC}"
heroku ps -a "$APP_NAME"

# Open app
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${BLUE}🌐 Opening app...${NC}"
heroku open -a "$APP_NAME"

# Show logs
echo -e "${BLUE}📝 Showing logs (Ctrl+C to exit):${NC}"
heroku logs --tail -a "$APP_NAME"
