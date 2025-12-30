# JASPER Stabilization Mode

## 🎯 CURRENT MISSION: STABILIZE (NO NEW FEATURES)

Read `STABILIZATION_PROMPT.md` for full details.

## Quick Reference

### VPS Access
```bash
ssh root@72.61.201.237
```

### Services
```bash
systemctl status jasper-crm
systemctl status jasper-celery-worker
systemctl status jasper-main-site
journalctl -u jasper-crm -f  # Live logs
```

### Key Paths (VPS)
```
/opt/jasper-crm/           # CRM backend
/opt/jasper-crm/data/      # JSON data files
/opt/jasper-main-site/     # Marketing site
/root/backups/             # Backup storage
/var/log/nginx/            # Nginx logs
```

### Key Paths (Local)
```
~/Downloads/jasper-financial-architecture/
├── jasper-crm/            # Backend code
├── jasper-portal-frontend/ # Admin portal
├── src/                   # Marketing site
└── STABILIZATION_PROMPT.md # Full mission brief
```

### Deploy Commands
```bash
# Sync single file
scp jasper-crm/file.py root@72.61.201.237:/opt/jasper-crm/

# Restart service
ssh root@72.61.201.237 'systemctl restart jasper-crm'

# Check health
curl https://api.jasperfinance.org/api/v1/health
```

## Phase Checklist

- [ ] Phase 1: Backups + Health checks
- [ ] Phase 2: Monitoring + Alerts
- [ ] Phase 3: Tests
- [ ] Phase 4: Documentation
- [ ] Phase 5: CI/CD

## RULES

1. **BACKUP FIRST** before any change
2. **NO NEW FEATURES** - stabilization only
3. **TEST BEFORE DEPLOY**
4. **SMALL CHANGES** - one at a time
