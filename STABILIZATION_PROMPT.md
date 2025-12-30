# JASPER Stabilization Mission

## OBJECTIVE
Stabilize the marketing site (jasperfinance.org) and CRM (api.jasperfinance.org) for production reliability. NO new features - only hardening, testing, monitoring, and documentation.

---

## CURRENT STATE

### Infrastructure
- **VPS**: 72.61.201.237 (Hostinger KVM 2, 2 vCPU, 8GB RAM, 100GB NVMe)
- **OS**: Ubuntu 24.04
- **Services Running**:
  - jasper-crm.service (FastAPI on port 8001)
  - jasper-celery-worker.service
  - jasper-celery-beat.service
  - jasper-main-site.service (port 3005)
  - jasper-memory.service
  - jasper-social.service

### Domains
- jasperfinance.org → Marketing site (Vite/React SPA)
- api.jasperfinance.org → CRM API (FastAPI)
- portal.jasperfinance.org → Admin portal

### Data Storage (PROBLEM: JSON files, not database)
```
/opt/jasper-crm/data/
├── blog_posts.json (484KB, 30 articles)
├── blog_revisions.json (2.5MB)
├── leads.json
├── clients.json
├── keywords.json
├── ab_tests.json
└── ... more JSON files
```

### Known Issues
- No automated backups
- No test coverage
- No CI/CD pipeline
- No error monitoring
- JSON files instead of PostgreSQL
- No health check alerts
- Manual deployments only

---

## STABILIZATION TASKS

### Phase 1: Immediate Safety (Day 1)

#### 1.1 Automated Backups
```bash
# Create backup script
ssh root@72.61.201.237 'mkdir -p /root/backups && cat > /opt/jasper-crm/scripts/backup.sh << "EOF"
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/jasper-data-$DATE.tar.gz"

# Backup all data
tar -czf $BACKUP_FILE /opt/jasper-crm/data/

# Keep only last 14 days
find $BACKUP_DIR -name "jasper-data-*.tar.gz" -mtime +14 -delete

# Log
echo "$(date): Backup created $BACKUP_FILE ($(du -h $BACKUP_FILE | cut -f1))" >> /var/log/jasper-backup.log
EOF
chmod +x /opt/jasper-crm/scripts/backup.sh'

# Add to cron (twice daily)
ssh root@72.61.201.237 'echo "0 */12 * * * /opt/jasper-crm/scripts/backup.sh" | crontab -'
```

#### 1.2 Health Check Endpoint
Verify/create comprehensive health check:
```python
# In jasper-crm/routes/health.py
@router.get("/health")
async def health_check():
    checks = {
        "api": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {}
    }
    
    # Check data files exist
    data_files = ["blog_posts.json", "leads.json", "keywords.json"]
    for f in data_files:
        path = Path(f"/opt/jasper-crm/data/{f}")
        checks["services"][f] = "ok" if path.exists() else "missing"
    
    # Check Redis
    try:
        redis_client.ping()
        checks["services"]["redis"] = "ok"
    except:
        checks["services"]["redis"] = "error"
    
    # Check disk space
    disk = shutil.disk_usage("/")
    checks["disk_free_gb"] = round(disk.free / (1024**3), 1)
    
    return checks
```

#### 1.3 Error Logging
```bash
# Ensure proper logging
ssh root@72.61.201.237 'cat > /etc/logrotate.d/jasper << EOF
/var/log/jasper-*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
}
EOF'
```

---

### Phase 2: Monitoring (Day 2)

#### 2.1 UptimeRobot Setup (Free)
Create monitors for:
- https://jasperfinance.org (marketing)
- https://api.jasperfinance.org/api/v1/health (CRM)
- https://portal.jasperfinance.org (admin)

#### 2.2 Simple Status Dashboard
Create `/status` endpoint that returns:
- All service health
- Last backup time
- Disk usage
- Recent errors count

#### 2.3 Alert Script
```bash
# /opt/jasper-crm/scripts/alert.sh
#!/bin/bash
# Send alert via existing CommsAgent or simple email

HEALTH=$(curl -s http://localhost:8001/api/v1/health)
if echo "$HEALTH" | grep -q "error"; then
    # Trigger alert
    curl -X POST "http://localhost:8001/api/v1/alerts/send" \
        -H "Content-Type: application/json" \
        -d '{"message": "JASPER Health Check Failed", "level": "critical"}'
fi
```

---

### Phase 3: Testing Foundation (Days 3-4)

#### 3.1 Critical Path Tests
Create `jasper-crm/tests/` with:

```python
# tests/test_health.py
def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

# tests/test_blog.py
def test_get_articles():
    response = client.get("/api/v1/blog/posts")
    assert response.status_code == 200
    assert len(response.json()) >= 30

def test_get_single_article():
    response = client.get("/api/v1/blog/posts/understanding-dfi-funding")
    assert response.status_code == 200

# tests/test_contact.py
def test_contact_form_submission():
    response = client.post("/api/v1/webhooks/contact-form", json={
        "name": "Test User",
        "email": "test@example.com",
        "message": "Test message"
    })
    assert response.status_code == 200
    assert response.json()["success"] == True

# tests/test_leads.py
def test_create_lead():
    # Test lead creation
    pass

def test_get_leads():
    # Test lead retrieval
    pass
```

#### 3.2 Test Runner Script
```bash
# /opt/jasper-crm/scripts/run_tests.sh
#!/bin/bash
cd /opt/jasper-crm
source venv/bin/activate
pytest tests/ -v --tb=short
```

---

### Phase 4: Documentation (Day 5)

#### 4.1 API Documentation
FastAPI auto-generates - ensure it's exposed:
- https://api.jasperfinance.org/docs (Swagger)
- https://api.jasperfinance.org/redoc (ReDoc)

#### 4.2 Create RUNBOOK.md
```markdown
# JASPER Operations Runbook

## Services
- jasper-crm: `systemctl restart jasper-crm`
- jasper-celery-worker: `systemctl restart jasper-celery-worker`
- jasper-main-site: `systemctl restart jasper-main-site`

## Logs
- CRM: `journalctl -u jasper-crm -f`
- Nginx: `tail -f /var/log/nginx/access.log`

## Backups
- Location: /root/backups/
- Restore: `tar -xzf /root/backups/jasper-data-YYYYMMDD.tar.gz -C /`

## Common Issues
1. 502 Bad Gateway: Check if service is running
2. Slow responses: Check Redis, restart Celery
3. Missing data: Restore from backup
```

#### 4.3 Create ARCHITECTURE.md
Document the system architecture with diagrams.

---

### Phase 5: CI/CD Setup (Days 6-7)

#### 5.1 GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy JASPER

on:
  push:
    branches: [master]
    paths:
      - 'jasper-crm/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd jasper-crm
          pip install -r requirements.txt
          pip install pytest
      - name: Run tests
        run: |
          cd jasper-crm
          pytest tests/ -v

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to VPS
        env:
          SSH_KEY: ${{ secrets.VPS_SSH_KEY }}
        run: |
          # Deploy script
          echo "Deploying..."
```

#### 5.2 Deployment Script
```bash
# /opt/jasper-crm/scripts/deploy.sh
#!/bin/bash
set -e

cd /opt/jasper-crm

# Pull latest
git pull origin master

# Install dependencies
source venv/bin/activate
pip install -r requirements.txt

# Run migrations (if any)
# python manage.py migrate

# Restart services
systemctl restart jasper-crm
systemctl restart jasper-celery-worker
systemctl restart jasper-celery-beat

# Verify health
sleep 5
curl -f http://localhost:8001/api/v1/health || exit 1

echo "Deployment complete!"
```

---

## SUCCESS CRITERIA

When complete, verify:

- [ ] `/root/backups/` has recent backup files
- [ ] `curl https://api.jasperfinance.org/api/v1/health` returns all "ok"
- [ ] `pytest tests/` passes with 0 failures
- [ ] UptimeRobot monitors are green
- [ ] `/docs` shows API documentation
- [ ] `RUNBOOK.md` exists and is accurate
- [ ] GitHub Actions runs on push

---

## CONSTRAINTS

1. **NO NEW FEATURES** - Stabilization only
2. **NO BREAKING CHANGES** - All existing functionality must work
3. **BACKUP BEFORE ANY CHANGE** - Always backup first
4. **TEST LOCALLY FIRST** - Don't deploy untested code
5. **ONE CHANGE AT A TIME** - Small, verifiable changes

---

## START COMMAND

```bash
cd /Users/mac/Downloads/jasper-financial-architecture
claude --dangerously-skip-permissions

# Then:
# Phase 1: "Set up automated backups and verify health endpoint"
# Phase 2: "Create monitoring and alerting"
# Phase 3: "Write critical path tests"
# Phase 4: "Create documentation"
# Phase 5: "Set up CI/CD pipeline"
```

---

## ROLLBACK

If anything breaks:
```bash
# Restore data
ssh root@72.61.201.237 'cd / && tar -xzf /root/backups/jasper-data-LATEST.tar.gz'

# Restart all services
ssh root@72.61.201.237 'systemctl restart jasper-crm jasper-celery-worker jasper-celery-beat jasper-main-site'
```
