#!/bin/bash
# JASPER Memory - VPS Deployment Script
# Shared Vector Memory Service for all Kutlwano Holdings apps
# Deploy to: root@72.61.201.237

set -e

VPS_HOST="root@72.61.201.237"
DEPLOY_DIR="/opt/jasper-memory"
SERVICE_NAME="jasper-memory"

echo "=== JASPER Memory Deployment ==="
echo "This will deploy the shared vector memory service"
echo ""

# 1. Create deployment directory on VPS
echo "[1/6] Creating deployment directory..."
ssh $VPS_HOST "mkdir -p $DEPLOY_DIR/data/milvus"

# 2. Copy files to VPS
echo "[2/6] Copying files to VPS..."
rsync -avz --exclude '__pycache__' --exclude '*.pyc' --exclude '.git' --exclude 'data' \
    ./ $VPS_HOST:$DEPLOY_DIR/

# 3. Create virtual environment and install dependencies
echo "[3/6] Installing dependencies (this may take a few minutes)..."
ssh $VPS_HOST << 'ENDSSH'
cd /opt/jasper-memory
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
ENDSSH

# 4. Create systemd service
echo "[4/6] Creating systemd service..."
ssh $VPS_HOST << 'ENDSSH'
cat > /etc/systemd/system/jasper-memory.service << 'EOF'
[Unit]
Description=JASPER Memory - Shared Vector Memory Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/jasper-memory
Environment="PATH=/opt/jasper-memory/venv/bin"
Environment="EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2"
Environment="JASPER_CRM_API_KEY=jcrm_sk_live_k8x9m2n4p5q7r0s3t6u"
Environment="JASPER_PORTAL_API_KEY=jportal_sk_live_a1b2c3d4e5f6g7h8i9j"
Environment="ALEPH_API_KEY=aleph_sk_live_z0y9x8w7v6u5t4s3r2q1"
ExecStart=/opt/jasper-memory/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8002
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable jasper-memory
ENDSSH

# 5. Download embedding model (first run will be slow)
echo "[5/6] Pre-downloading embedding model..."
ssh $VPS_HOST << 'ENDSSH'
cd /opt/jasper-memory
source venv/bin/activate
python3 -c "
from sentence_transformers import SentenceTransformer
print('Downloading embedding model...')
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
print('Model downloaded successfully!')
print(f'Dimensions: {model.get_sentence_embedding_dimension()}')
"
ENDSSH

# 6. Start service
echo "[6/6] Starting service..."
ssh $VPS_HOST "systemctl restart jasper-memory && sleep 5 && systemctl status jasper-memory"

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "JASPER Memory API: http://72.61.201.237:8002"
echo "API Docs: http://72.61.201.237:8002/docs"
echo "Health Check: http://72.61.201.237:8002/health"
echo ""
echo "API Keys:"
echo "  JASPER CRM: jcrm_sk_live_k8x9m2n4p5q7r0s3t6u"
echo "  JASPER Portal: jportal_sk_live_a1b2c3d4e5f6g7h8i9j"
echo "  Aleph: aleph_sk_live_z0y9x8w7v6u5t4s3r2q1"
echo ""
echo "Collections available:"
echo "  - jasper_leads (CRM lead data)"
echo "  - jasper_projects (past projects)"
echo "  - jasper_dfis (DFI requirements)"
echo "  - jasper_templates (model components)"
echo "  - jasper_content (blog/docs)"
echo "  - aleph_knowledge (future)"
