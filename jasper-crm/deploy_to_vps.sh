#!/bin/bash
# Deploy JASPER CRM with Lead Prospector to VPS
# Run from local machine: ./deploy_to_vps.sh

set -e

VPS_HOST="root@46.202.163.77"
VPS_PATH="/opt/jasper-crm"
LOCAL_PATH="$(dirname "$0")"

echo "==================================="
echo "JASPER CRM Deployment Script"
echo "==================================="

# 1. Create directory on VPS
echo "[1/6] Creating directory on VPS..."
ssh $VPS_HOST "mkdir -p $VPS_PATH"

# 2. Sync files (excluding venv, __pycache__, etc.)
echo "[2/6] Syncing files to VPS..."
rsync -avz --progress \
    --exclude 'venv/' \
    --exclude '__pycache__/' \
    --exclude '*.pyc' \
    --exclude '.git/' \
    --exclude '*.sqlite' \
    --exclude '.env' \
    "$LOCAL_PATH/" "$VPS_HOST:$VPS_PATH/"

# 3. Create .env file on VPS
echo "[3/6] Setting up environment..."
ssh $VPS_HOST "cat > $VPS_PATH/.env << 'ENVEOF'
DATABASE_URL=postgresql://jasper:jasper_secure_pwd@localhost:5432/jasper_crm
CRM_API_URL=http://localhost:8001/api/v1
OPENROUTER_API_KEY=\${OPENROUTER_API_KEY}
AI_BLOG_API_KEY=jasper-ai-blog-key
BLOG_API_URL=http://localhost:3003/api/blog
DEBUG=false
ENVEOF"

# 4. Install dependencies
echo "[4/6] Installing dependencies..."
ssh $VPS_HOST "cd $VPS_PATH && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"

# 5. Set up systemd service
echo "[5/6] Setting up systemd service..."
ssh $VPS_HOST "cat > /etc/systemd/system/jasper-crm.service << 'SERVICEEOF'
[Unit]
Description=JASPER CRM FastAPI
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/jasper-crm
Environment=PATH=/opt/jasper-crm/venv/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/opt/jasper-crm/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICEEOF"

# 6. Enable and start service
echo "[6/6] Starting CRM service..."
ssh $VPS_HOST "systemctl daemon-reload && systemctl enable jasper-crm && systemctl restart jasper-crm"

# 7. Set up cron jobs for prospecting
echo "[7/6] Setting up cron jobs..."
ssh $VPS_HOST "cat > /etc/cron.d/jasper-prospector << 'CRONEOF'
# JASPER News Monitor - Daily at 6 AM SAST
0 4 * * * root curl -s -X POST http://localhost:8001/api/v1/news/scan >/dev/null 2>&1

# JASPER Lead Prospector - Daily at 7 AM SAST
0 5 * * * root curl -s -X POST http://localhost:8001/api/v1/prospector/run >/dev/null 2>&1
CRONEOF"

echo ""
echo "==================================="
echo "Deployment Complete!"
echo "==================================="
echo ""
echo "CRM should be running on port 8001"
echo "Check status: ssh $VPS_HOST 'systemctl status jasper-crm'"
echo "View logs: ssh $VPS_HOST 'journalctl -u jasper-crm -f'"
echo ""
echo "API Endpoints:"
echo "  - Health: http://localhost:8001/health"
echo "  - Prospector Status: http://localhost:8001/api/v1/prospector/status"
echo "  - Run Prospecting: POST http://localhost:8001/api/v1/prospector/run"
echo ""
