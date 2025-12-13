#!/bin/bash

# ============================================
# JASPER Financial Architecture - VPS Deployment Script
# Server: 72.61.201.237 (srv1145603.hstgr.cloud)
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="72.61.201.237"
VPS_USER="root"
DEPLOY_PATH="/root/jasper-financial-architecture"
LOCAL_PATH="$(dirname "$(dirname "$(readlink -f "$0")")")"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}JASPER Financial Architecture - VPS Deployment${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "$LOCAL_PATH/ecosystem.config.js" ]; then
    echo -e "${RED}Error: ecosystem.config.js not found. Run from project root.${NC}"
    exit 1
fi

# Function: Build applications locally
build_apps() {
    echo -e "${YELLOW}Building applications...${NC}"

    # Build jasper-portal-frontend
    echo -e "${BLUE}Building jasper-portal-frontend...${NC}"
    cd "$LOCAL_PATH/jasper-portal-frontend"
    npm install
    npm run build

    # Build jasper-client-portal
    echo -e "${BLUE}Building jasper-client-portal...${NC}"
    cd "$LOCAL_PATH/jasper-client-portal"
    npm install
    npm run build

    # Install jasper-api dependencies
    echo -e "${BLUE}Installing jasper-api dependencies...${NC}"
    cd "$LOCAL_PATH/jasper-api"
    npm install

    echo -e "${GREEN}All applications built successfully!${NC}"
}

# Function: Create deployment archive
create_archive() {
    echo -e "${YELLOW}Creating deployment archive...${NC}"

    cd "$LOCAL_PATH"

    # Create tarball excluding node_modules and .next (will reinstall on server)
    tar -czvf jasper-deploy.tar.gz \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='.git' \
        --exclude='*.log' \
        jasper-api \
        jasper-portal-frontend \
        jasper-client-portal \
        ecosystem.config.js \
        traefik

    echo -e "${GREEN}Archive created: jasper-deploy.tar.gz${NC}"
}

# Function: Upload to VPS
upload_to_vps() {
    echo -e "${YELLOW}Uploading to VPS...${NC}"

    # Upload archive
    scp "$LOCAL_PATH/jasper-deploy.tar.gz" "$VPS_USER@$VPS_IP:/root/"

    echo -e "${GREEN}Upload complete!${NC}"
}

# Function: Deploy on VPS
deploy_on_vps() {
    echo -e "${YELLOW}Deploying on VPS...${NC}"

    ssh "$VPS_USER@$VPS_IP" << 'ENDSSH'
set -e

cd /root

# Create logs directory
mkdir -p jasper-financial-architecture/logs

# Extract archive
tar -xzvf jasper-deploy.tar.gz -C jasper-financial-architecture --strip-components=0 2>/dev/null || \
    tar -xzvf jasper-deploy.tar.gz

cd jasper-financial-architecture

# Install dependencies for each app
echo "Installing jasper-api dependencies..."
cd jasper-api && npm install --production && cd ..

echo "Installing jasper-portal-frontend dependencies..."
cd jasper-portal-frontend && npm install --production && npm run build && cd ..

echo "Installing jasper-client-portal dependencies..."
cd jasper-client-portal && npm install --production && npm run build && cd ..

# Copy Traefik config
echo "Copying Traefik configuration..."
cp -f traefik/dynamic/jasper-apps.yml /root/traefik/dynamic/

# Reload Traefik
docker exec traefik kill -s HUP 1 2>/dev/null || echo "Traefik will pick up changes automatically"

# Stop existing PM2 processes
pm2 stop ecosystem.config.js 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start all apps with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Show status
pm2 status

echo "Deployment complete!"
ENDSSH

    echo -e "${GREEN}VPS deployment complete!${NC}"
}

# Function: Quick restart (no rebuild)
quick_restart() {
    echo -e "${YELLOW}Quick restart on VPS...${NC}"

    ssh "$VPS_USER@$VPS_IP" << 'ENDSSH'
cd /root/jasper-financial-architecture
pm2 restart ecosystem.config.js
pm2 status
ENDSSH

    echo -e "${GREEN}Quick restart complete!${NC}"
}

# Function: Check status
check_status() {
    echo -e "${YELLOW}Checking VPS status...${NC}"

    ssh "$VPS_USER@$VPS_IP" << 'ENDSSH'
echo "=== PM2 Status ==="
pm2 status

echo ""
echo "=== Port Check ==="
netstat -tlnp | grep -E ':(3002|3003|3004)'

echo ""
echo "=== Health Checks ==="
curl -s http://localhost:3003/health || echo "API: Not responding"
curl -s http://localhost:3002 | head -c 100 || echo "Portal: Not responding"
curl -s http://localhost:3004 | head -c 100 || echo "Client: Not responding"
ENDSSH
}

# Function: View logs
view_logs() {
    echo -e "${YELLOW}Viewing logs...${NC}"
    ssh "$VPS_USER@$VPS_IP" "pm2 logs --lines 50"
}

# Main menu
case "${1:-}" in
    build)
        build_apps
        ;;
    archive)
        create_archive
        ;;
    upload)
        upload_to_vps
        ;;
    deploy)
        deploy_on_vps
        ;;
    full)
        build_apps
        create_archive
        upload_to_vps
        deploy_on_vps
        check_status
        ;;
    restart)
        quick_restart
        ;;
    status)
        check_status
        ;;
    logs)
        view_logs
        ;;
    *)
        echo "Usage: $0 {build|archive|upload|deploy|full|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  build    - Build all applications locally"
        echo "  archive  - Create deployment archive"
        echo "  upload   - Upload archive to VPS"
        echo "  deploy   - Deploy and start on VPS"
        echo "  full     - Complete deployment (build + archive + upload + deploy)"
        echo "  restart  - Quick restart all apps on VPS"
        echo "  status   - Check VPS status"
        echo "  logs     - View PM2 logs"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"
