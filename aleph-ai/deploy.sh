#!/bin/bash
# ALEPH AI Infrastructure - VPS Deployment Script
# Deploy to: root@72.61.201.237
# Port: 8000

set -e

VPS_HOST="root@72.61.201.237"
DEPLOY_DIR="/opt/aleph-ai"
SERVICE_NAME="aleph-ai"

echo "=============================================="
echo "  ALEPH AI Infrastructure Deployment"
echo "  Self-Hosted AI Platform for Kutlwano Holdings"
echo "=============================================="
echo ""

# 1. Create deployment directory on VPS
echo "[1/7] Creating deployment directory..."
ssh $VPS_HOST "mkdir -p $DEPLOY_DIR/data/milvus $DEPLOY_DIR/knowledge"

# 2. Copy files to VPS
echo "[2/7] Copying files to VPS..."
rsync -avz --exclude '__pycache__' --exclude '*.pyc' --exclude '.git' --exclude 'data' --exclude '.env' \
    ./ $VPS_HOST:$DEPLOY_DIR/

# 3. Copy .env if it exists
if [ -f .env ]; then
    echo "[2.5/7] Copying .env configuration..."
    scp .env $VPS_HOST:$DEPLOY_DIR/.env
fi

# 4. Create virtual environment and install dependencies
echo "[3/7] Installing dependencies (this may take several minutes)..."
ssh $VPS_HOST << 'ENDSSH'
cd /opt/aleph-ai
python3 -m venv venv || python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip wheel setuptools
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
pip install psutil  # For memory monitoring
ENDSSH

# 5. Download AI models (this takes time on first run)
echo "[4/7] Downloading AI models (first run may take 10-15 minutes)..."
ssh $VPS_HOST << 'ENDSSH'
cd /opt/aleph-ai
source venv/bin/activate
python3 -c "
import os
os.environ['TRANSFORMERS_VERBOSITY'] = 'info'

print('=' * 50)
print('Downloading embedding model...')
from sentence_transformers import SentenceTransformer
try:
    model = SentenceTransformer('google/embeddinggemma-300m')
    print(f'EmbeddingGemma loaded: {model.get_sentence_embedding_dimension()} dims')
except Exception as e:
    print(f'EmbeddingGemma not available, using fallback: {e}')
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    print(f'Fallback MiniLM loaded: {model.get_sentence_embedding_dimension()} dims')

print('=' * 50)
print('Downloading vision models...')
from transformers import AutoProcessor, AutoModelForVision2Seq

try:
    print('Loading SmolVLM-500M...')
    AutoProcessor.from_pretrained('HuggingFaceTB/SmolVLM-500M-Instruct', trust_remote_code=True)
    AutoModelForVision2Seq.from_pretrained('HuggingFaceTB/SmolVLM-500M-Instruct', trust_remote_code=True)
    print('SmolVLM-500M ready')
except Exception as e:
    print(f'SmolVLM error: {e}')

try:
    print('Loading SmolDocling...')
    AutoProcessor.from_pretrained('ds4sd/SmolDocling-256M-preview', trust_remote_code=True)
    AutoModelForVision2Seq.from_pretrained('ds4sd/SmolDocling-256M-preview', trust_remote_code=True)
    print('SmolDocling ready')
except Exception as e:
    print(f'SmolDocling error: {e}')

print('=' * 50)
print('All models downloaded!')
"
ENDSSH

# 6. Create systemd service
echo "[5/7] Creating systemd service..."
ssh $VPS_HOST << 'ENDSSH'
cat > /etc/systemd/system/aleph-ai.service << 'EOF'
[Unit]
Description=ALEPH AI Infrastructure - Self-Hosted AI Platform
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/aleph-ai
Environment="PATH=/opt/aleph-ai/venv/bin"
EnvironmentFile=/opt/aleph-ai/.env
ExecStart=/opt/aleph-ai/venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable aleph-ai
ENDSSH

# 7. Start service
echo "[6/7] Starting service..."
ssh $VPS_HOST "systemctl restart aleph-ai && sleep 10 && systemctl status aleph-ai"

# 8. Run health check
echo "[7/7] Running health check..."
sleep 5
curl -s http://72.61.201.237:8000/health | python3 -m json.tool || echo "Health check pending..."

echo ""
echo "=============================================="
echo "  ALEPH AI Infrastructure Deployed!"
echo "=============================================="
echo ""
echo "API Endpoints:"
echo "  Base URL:     http://72.61.201.237:8000"
echo "  API Docs:     http://72.61.201.237:8000/docs"
echo "  Health:       http://72.61.201.237:8000/health"
echo "  Status:       http://72.61.201.237:8000/status"
echo ""
echo "Endpoints:"
echo "  POST /v1/embed         - Text embeddings"
echo "  POST /v1/embed/batch   - Batch embeddings"
echo "  POST /v1/vision/ocr    - Document OCR"
echo "  POST /v1/vision/analyze- Image analysis"
echo "  POST /v1/vision/detect - Object detection"
echo "  POST /v1/search        - Semantic search"
echo "  POST /v1/complete      - Text completion"
echo "  POST /v1/ingest/*      - Data ingestion"
echo "  POST /v1/rag/*         - RAG queries"
echo ""
echo "Businesses Served:"
echo "  - JASPER Financial Architecture"
echo "  - ALEPH Creative-Hub"
echo "  - Gahn Eden Foods"
echo "  - Paji E-Commerce"
echo "  - Ubuntu Agricultural Initiative"
echo ""
echo "=============================================="
