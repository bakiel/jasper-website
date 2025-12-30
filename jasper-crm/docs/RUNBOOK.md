# JASPER CRM Operations Runbook

## Quick Reference

### Service Status
```bash
systemctl status jasper-crm jasper-celery-worker jasper-celery-beat jasper-main-site jasper-memory jasper-social
```

### Restart Services
```bash
# Single service
systemctl restart jasper-crm

# All JASPER services
systemctl restart jasper-crm jasper-celery-worker jasper-celery-beat jasper-main-site
```

### View Logs
```bash
# CRM API logs (live)
journalctl -u jasper-crm -f

# Last 100 lines
journalctl -u jasper-crm -n 100

# Celery worker
journalctl -u jasper-celery-worker -f

# Nginx access
tail -f /var/log/nginx/access.log
```

---

## Health Checks

| Endpoint | Purpose |
|----------|---------|
| `/health` | Basic alive check |
| `/health/detailed` | Database, cache, AI status |
| `/health/system` | Disk, files, backups |
| `/status` | Overall system status |

```bash
curl -s http://localhost:8001/health | jq
curl -s https://api.jasperfinance.org/health
```

---

## Backups

- Location: `/root/backups/jasper-data-YYYYMMDD_HHMMSS.tar.gz`
- Schedule: 6:00 AM and 6:00 PM UTC
- Retention: 14 days

### Manual Backup
```bash
/opt/jasper-crm/scripts/backup_all.sh
```

### Restore
```bash
cd / && tar -xzf /root/backups/jasper-data-YYYYMMDD_HHMMSS.tar.gz
systemctl restart jasper-crm jasper-celery-worker
```

---

## Common Issues

### 502 Bad Gateway
```bash
systemctl status jasper-crm
systemctl restart jasper-crm
journalctl -u jasper-crm -n 50
```

### Slow Responses
```bash
systemctl restart redis jasper-celery-worker jasper-celery-beat
```

### Missing Data
```bash
cd / && tar -xzf /root/backups/jasper-data-LATEST.tar.gz
systemctl restart jasper-crm
```

---

## Deployment

```bash
cd /opt/jasper-crm
git pull origin master
source venv/bin/activate
pip install -r requirements.txt
systemctl restart jasper-crm jasper-celery-worker jasper-celery-beat
```

---

## Key Paths

| Path | Contents |
|------|----------|
| `/opt/jasper-crm/` | CRM backend |
| `/opt/jasper-crm/data/` | JSON data |
| `/opt/jasper-main-site/` | Marketing site |
| `/root/backups/` | Backups |

---

## Monitoring

Set up UptimeRobot for:
1. https://jasperfinance.org
2. https://api.jasperfinance.org/health
3. https://portal.jasperfinance.org
