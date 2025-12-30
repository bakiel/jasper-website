# JASPER Monitoring Setup Guide

## UptimeRobot Configuration (Free Tier)

### Step 1: Create Account
Go to https://uptimerobot.com and create a free account.

### Step 2: Add Monitors

#### Monitor 1: CRM API Health
- **Type**: HTTP(S)
- **URL**: `https://api.jasperfinance.org/status`
- **Friendly Name**: JASPER CRM API
- **Monitoring Interval**: 5 minutes
- **Alert Contacts**: Add your email

#### Monitor 2: Marketing Site
- **Type**: HTTP(S)
- **URL**: `https://jasperfinance.org`
- **Friendly Name**: JASPER Marketing Site
- **Monitoring Interval**: 5 minutes

#### Monitor 3: Admin Portal  
- **Type**: HTTP(S)
- **URL**: `https://portal.jasperfinance.org`
- **Friendly Name**: JASPER Admin Portal
- **Monitoring Interval**: 5 minutes

### Step 3: Configure Alerts
1. Go to My Settings → Alert Contacts
2. Add your email and phone number
3. Enable "Send email when monitor goes down"
4. Enable "Send email when monitor comes back up"

---

## Health Endpoints Reference

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `/health` | Simple liveness | `{"status":"healthy"}` |
| `/health/detailed` | DB + cache + services | Full check with timings |
| `/health/system` | Disk + files + backups | System-level status |
| `/status` | Combined quick check | **Use for UptimeRobot** |
| `/metrics` | Prometheus format | For Grafana/Prometheus |

---

## Quick Test Commands

```bash
# Local health check
curl -s https://api.jasperfinance.org/status | jq

# All services status
curl -s https://api.jasperfinance.org/health/aggregated | jq

# System health (disk, backups)
curl -s https://api.jasperfinance.org/health/system | jq
```

---

## Alert Thresholds

The `/status` endpoint returns warnings when:
- Backup age > 24 hours → `"overall": "warning"`
- Any service down → `"overall": "degraded"`
- Disk < 5GB free → Warning in `/health/system`

---

## Manual Health Check Script

Save this to run manually or via cron:

```bash
#!/bin/bash
# /usr/local/bin/jasper-health-check.sh

STATUS=$(curl -s https://api.jasperfinance.org/status)
OVERALL=$(echo $STATUS | jq -r '.overall')

if [ "$OVERALL" != "healthy" ]; then
    echo "JASPER ALERT: Status is $OVERALL"
    echo $STATUS | jq
    # Add notification here (email, Slack, etc.)
fi
```
