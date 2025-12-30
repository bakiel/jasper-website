# JASPER Operations Runbook

> Quick reference for operating and troubleshooting JASPER infrastructure.

## 🔑 Quick Access

| Service | URL | Port |
|---------|-----|------|
| Marketing Site | https://jasperfinance.org | 3005 |
| CRM API | https://api.jasperfinance.org | 8001 |
| Admin Portal | https://portal.jasperfinance.org | 3002 |
| API Docs | https://api.jasperfinance.org/docs | - |

**VPS**: 72.61.201.237 (Hostinger KVM 2)

```bash
ssh root@72.61.201.237
```

---

## 📊 Health Checks

### Quick Status
```bash
# Combined status (best for monitoring)
curl -s https://api.jasperfinance.org/status | jq

# Detailed health
curl -s https://api.jasperfinance.org/health/detailed | jq

# System health (disk, backups)
curl -s https://api.jasperfinance.org/health/system | jq
```

### From VPS
```bash
# All services status
systemctl status jasper-crm jasper-celery-worker jasper-main-site

# Check if ports are listening
netstat -tlnp | grep -E '8001|3005|3002'
```

---

## 🔧 Service Management

### Restart Services
```bash
# CRM API
systemctl restart jasper-crm

# Celery workers
systemctl restart jasper-celery-worker
systemctl restart jasper-celery-beat

# Marketing site
systemctl restart jasper-main-site

# All services
systemctl restart jasper-crm jasper-celery-worker jasper-celery-beat jasper-main-site
```

### View Logs
```bash
# CRM API logs (live)
journalctl -u jasper-crm -f

# Last 100 lines
journalctl -u jasper-crm -n 100

# Errors only
journalctl -u jasper-crm --since "1 hour ago" | grep -i error

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

---

## 💾 Backups

### Backup Locations
```
/root/backups/              # JSON data backups (tar.gz)
/opt/jasper-crm/backups/    # PostgreSQL dumps
```

### Check Backup Status
```bash
# List recent backups
ls -lh /root/backups/

# Check backup log
tail -20 /var/log/jasper-backup.log

# Via API
curl -s https://api.jasperfinance.org/health/system | jq '.checks.backup'
```

### Manual Backup
```bash
/opt/jasper-crm/scripts/backup_all.sh
```

### Restore from Backup
```bash
# 1. Stop services
systemctl stop jasper-crm jasper-celery-worker

# 2. Extract backup
cd /
tar -xzf /root/backups/jasper-data-YYYYMMDD_HHMMSS.tar.gz

# 3. Restart services
systemctl start jasper-crm jasper-celery-worker
```

---

## 🧪 Testing

### Run Integration Tests
```bash
ssh root@72.61.201.237 '/opt/jasper-crm/scripts/run_tests.sh'
```

### Quick Smoke Test
```bash
# Health
curl -s https://api.jasperfinance.org/health

# Blog posts
curl -s https://api.jasperfinance.org/api/v1/blog/posts | jq length

# Status
curl -s https://api.jasperfinance.org/status | jq '.overall'
```

---

## 🚨 Common Issues

### 502 Bad Gateway
**Cause**: Service not running or crashed

```bash
# Check service status
systemctl status jasper-crm

# Restart
systemctl restart jasper-crm

# Check logs for error
journalctl -u jasper-crm -n 50
```

### Slow API Responses
**Cause**: Redis issue or Celery backlog

```bash
# Check Redis
redis-cli ping

# Check Celery queue
ssh root@72.61.201.237 'cd /opt/jasper-crm && source venv/bin/activate && celery -A celery_app inspect active'

# Restart workers
systemctl restart jasper-celery-worker
```

### Disk Full
**Cause**: Logs or backups accumulated

```bash
# Check disk usage
df -h /

# Clean old backups (keeps 14 days)
find /root/backups -name "jasper-*.tar.gz" -mtime +7 -delete

# Clean old logs
journalctl --vacuum-time=7d
```

### Database Locked (SQLite issues)
**Cause**: Concurrent write to JSON files

```bash
# Restart service to release locks
systemctl restart jasper-crm
```

---

## 🔄 Deployment

### Deploy from GitHub
```bash
ssh root@72.61.201.237 '/opt/jasper-crm/scripts/deploy.sh'
```

### Manual Deployment
```bash
cd /opt/jasper-crm

# Backup first
/opt/jasper-crm/scripts/backup_all.sh

# Pull latest
git pull origin master

# Install deps
source venv/bin/activate
pip install -r requirements.txt

# Restart
systemctl restart jasper-crm jasper-celery-worker jasper-celery-beat

# Verify
curl -s http://localhost:8001/health
```

---

## 📁 Directory Structure

```
/opt/jasper-crm/
├── app/                    # FastAPI application
├── agents/                 # AI agents (Research, Comms)
├── data/                   # JSON data files
│   ├── blog_posts.json
│   ├── leads.json
│   └── ...
├── routes/                 # API endpoints
├── services/               # Business logic
├── scripts/                # Utility scripts
├── tests/                  # Integration tests
├── venv/                   # Python virtual env
└── .env                    # Environment config

/opt/jasper-main-site/      # Marketing website
/root/backups/              # Data backups
/var/log/nginx/             # Web server logs
```

---

## 🔐 Environment Variables

Key variables in `/opt/jasper-crm/.env`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection |
| `REDIS_URL` | Redis connection |
| `JWT_SECRET` | Auth token secret |
| `OPENROUTER_API_KEY` | AI model access |
| `DEEPSEEK_API_KEY` | DeepSeek models |
| `GEMINI_API_KEY` | Google Gemini |

---

## 📞 Escalation

1. **Check health endpoints first**
2. **Review logs** (`journalctl -u jasper-crm -n 100`)
3. **Restart services** if simple fix
4. **Restore from backup** if data corruption
5. **Contact**: See project contacts for escalation

---

## ✅ Daily Checks

- [ ] `curl https://api.jasperfinance.org/status` returns healthy
- [ ] Backup age < 24 hours
- [ ] Disk usage < 80%
- [ ] No errors in last hour (`journalctl -u jasper-crm --since "1 hour ago" | grep -i error`)
