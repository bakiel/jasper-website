#!/bin/bash
# JASPER CRM - VPS Deployment Script
# Deploy to: root@72.61.201.237

set -e

VPS_HOST="root@72.61.201.237"
DEPLOY_DIR="/opt/jasper-crm"
SERVICE_NAME="jasper-crm"

echo "=== JASPER CRM Deployment ==="

# 1. Create deployment directory on VPS
echo "Creating deployment directory..."
ssh $VPS_HOST "mkdir -p $DEPLOY_DIR"

# 2. Copy files to VPS
echo "Copying files to VPS..."
rsync -avz --exclude '__pycache__' --exclude '*.pyc' --exclude '.git' \
    ./ $VPS_HOST:$DEPLOY_DIR/

# 3. Create virtual environment and install dependencies
echo "Installing dependencies..."
ssh $VPS_HOST << 'ENDSSH'
cd /opt/jasper-crm
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
ENDSSH

# 4. Create PostgreSQL database (if not exists)
echo "Setting up database..."
ssh $VPS_HOST << 'ENDSSH'
sudo -u postgres psql -c "CREATE DATABASE jasper_crm;" 2>/dev/null || echo "Database exists"
sudo -u postgres psql -c "CREATE USER jasper WITH PASSWORD 'jasper_secure_pwd';" 2>/dev/null || echo "User exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE jasper_crm TO jasper;"
sudo -u postgres psql -c "ALTER DATABASE jasper_crm OWNER TO jasper;"
ENDSSH

# 5. Create systemd service
echo "Creating systemd service..."
ssh $VPS_HOST << 'ENDSSH'
cat > /etc/systemd/system/jasper-crm.service << 'EOF'
[Unit]
Description=JASPER CRM API
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/jasper-crm
Environment="PATH=/opt/jasper-crm/venv/bin"
Environment="DATABASE_URL=postgresql://jasper:jasper_secure_pwd@localhost:5432/jasper_crm"
Environment="OPENROUTER_API_KEY=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"
ExecStart=/opt/jasper-crm/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable jasper-crm
systemctl restart jasper-crm
ENDSSH

# 6. Configure nginx reverse proxy
echo "Configuring nginx..."
ssh $VPS_HOST << 'ENDSSH'
cat > /etc/nginx/sites-available/jasper-crm << 'EOF'
server {
    listen 80;
    server_name crm.jasperfinance.org;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/jasper-crm /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
ENDSSH

echo "=== Deployment Complete ==="
echo "CRM API: http://72.61.201.237:8001"
echo "API Docs: http://72.61.201.237:8001/docs"
echo ""
echo "Next steps:"
echo "1. Add DNS record: crm.jasperfinance.org -> 72.61.201.237"
echo "2. Run: certbot --nginx -d crm.jasperfinance.org"
