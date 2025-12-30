#!/bin/bash
# JASPER CRM Deployment Script
# Location: /opt/jasper-crm/scripts/deploy.sh
# Usage: ./deploy.sh [--skip-backup] [--service=crm|site|all]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
CRM_DIR="/opt/jasper-crm"
SITE_DIR="/opt/jasper-main-site"
LOG_FILE="/var/log/jasper-deploy.log"
SERVICE="${2:-all}"
SKIP_BACKUP=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --skip-backup) SKIP_BACKUP=true ;;
        --service=*) SERVICE="${arg#*=}" ;;
    esac
done

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "[ERROR] $1" >> $LOG_FILE
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Pre-flight checks
log "Starting JASPER deployment..."
log "Service: $SERVICE"

# Backup before deploy
if [ "$SKIP_BACKUP" = false ]; then
    log "Creating pre-deploy backup..."
    $CRM_DIR/scripts/backup_all.sh || warn "Backup failed, continuing..."
fi

# Deploy CRM
deploy_crm() {
    log "Deploying CRM..."
    cd $CRM_DIR
    
    # Pull latest code
    log "Pulling from git..."
    git fetch origin
    git reset --hard origin/master
    
    # Install dependencies
    log "Installing Python dependencies..."
    source venv/bin/activate
    pip install -r requirements.txt --quiet
    
    # Restart services
    log "Restarting CRM services..."
    systemctl restart jasper-crm
    systemctl restart jasper-celery-worker
    systemctl restart jasper-celery-beat
    
    # Health check
    sleep 3
    if curl -sf http://localhost:8001/health > /dev/null; then
        log "CRM health check: PASSED"
    else
        error "CRM health check: FAILED"
    fi
}

# Deploy Marketing Site
deploy_site() {
    log "Deploying Marketing Site..."
    cd $SITE_DIR
    
    # Pull latest code
    log "Pulling from git..."
    git fetch origin
    git reset --hard origin/master
    
    # Install and build
    log "Installing Node dependencies..."
    npm ci --silent
    
    log "Building site..."
    npm run build
    
    # Restart service
    log "Restarting site service..."
    systemctl restart jasper-main-site
    
    # Health check
    sleep 3
    if curl -sf http://localhost:3005 > /dev/null; then
        log "Site health check: PASSED"
    else
        error "Site health check: FAILED"
    fi
}

# Main execution
case $SERVICE in
    crm)
        deploy_crm
        ;;
    site)
        deploy_site
        ;;
    all)
        deploy_crm
        deploy_site
        ;;
    *)
        error "Unknown service: $SERVICE. Use: crm, site, or all"
        ;;
esac

# Final status
log "Deployment complete!"
log "Checking overall health..."

echo ""
echo "=== Service Status ==="
systemctl is-active jasper-crm && echo "jasper-crm: UP" || echo "jasper-crm: DOWN"
systemctl is-active jasper-celery-worker && echo "jasper-celery-worker: UP" || echo "jasper-celery-worker: DOWN"
systemctl is-active jasper-main-site && echo "jasper-main-site: UP" || echo "jasper-main-site: DOWN"

echo ""
echo "=== Health Endpoints ==="
curl -s http://localhost:8001/health | jq -c . 2>/dev/null || echo "CRM: unreachable"
curl -s http://localhost:8001/status | jq -c . 2>/dev/null || echo "Status: unreachable"

log "Done!"
