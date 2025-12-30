# JASPER Monitoring Setup Guide

## UptimeRobot Configuration (Free Tier)

### Step 1: Create Account
Go to https://uptimerobot.com and create a free account.

### Step 2: Add Monitors

Create these 4 monitors:

| Name | URL | Type | Interval |
|------|-----|------|----------|
| JASPER Status | `https://api.jasperfinance.org/status` | HTTP(s) | 5 min |
| JASPER Marketing Site | `https://jasperfinance.org` | HTTP(s) | 5 min |
| JASPER Admin Portal | `https://portal.jasperfinance.org` | HTTP(s) | 5 min |
| JASPER API Health | `https://api.jasperfinance.org/health/aggregated` | HTTP(s) | 5 min |

### Step 3: Configure Alerts

1. Go to "Alert Contacts"
2. Add your email: bakiel@kutlwano.holdings
3. (Optional) Add WhatsApp via Twilio integration

### Step 4: Verify Monitors

All should show "Up" status within 5 minutes.

---

## Health Endpoints Reference

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `/status` | Quick overview | `{"overall": "healthy", "services": {...}}` |
| `/health/detailed` | CRM internals | Database, cache, API keys |
| `/health/aggregated` | All services | CRM, API, sites, portals |
| `/health/system` | Infrastructure | Disk, data files, backups |
| `/health/live` | Liveness probe | `{"status": "alive"}` |
| `/health/ready` | Readiness probe | `{"status": "ready"}` |

---

## Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Disk Free | < 10GB | < 5GB |
| Backup Age | > 24 hours | > 48 hours |
| Service Down | 1 service | > 2 services |

---

## Manual Health Check

```bash
# Quick status
curl -s https://api.jasperfinance.org/status | jq .

# Full service health
curl -s https://api.jasperfinance.org/health/aggregated | jq .

# System health (disk, backups)
curl -s https://api.jasperfinance.org/health/system | jq .
```

---

## Backup Verification

```bash
# Check backup exists
ssh root@72.61.201.237 'ls -lh /root/backups/'

# Run manual backup
ssh root@72.61.201.237 '/opt/jasper-crm/scripts/backup_all.sh'

# Check backup log
ssh root@72.61.201.237 'tail -20 /var/log/jasper-backup.log'
```
