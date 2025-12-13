# JASPER Deployment Schedule
## Task Run Plan

**Target Date:** _______________ (fill in)
**Start Time:** _______________
**Estimated Duration:** 5 hours

---

## PRE-DEPLOYMENT (Day Before)

| Time | Task | Owner | Status |
|------|------|-------|--------|
| -1 day | Review all documentation | You | [ ] |
| -1 day | Confirm VPS accessible: `ssh root@72.61.201.237` | You | [ ] |
| -1 day | Verify credentials file exists: `~/.jasper-secrets/CREDENTIALS.env` | You | [ ] |
| -1 day | Check Cloudflare account access | You | [ ] |
| -1 day | Ensure phone ready for WhatsApp QR scan | You | [ ] |

---

## DEPLOYMENT DAY

### Block 1: Infrastructure (Start + 0:00 to 1:00)

| Time | Task | Duration | Status |
|------|------|----------|--------|
| +0:00 | SSH into VPS | 2 min | [ ] |
| +0:02 | System update (`apt update && apt upgrade -y`) | 10 min | [ ] |
| +0:12 | Install Python 3.12 | 5 min | [ ] |
| +0:17 | Install Node.js 18 | 5 min | [ ] |
| +0:22 | Install PostgreSQL | 5 min | [ ] |
| +0:27 | Install Redis | 3 min | [ ] |
| +0:30 | Install Nginx | 3 min | [ ] |
| +0:33 | Install Supervisor | 2 min | [ ] |
| +0:35 | Install Chromium | 5 min | [ ] |
| +0:40 | Verify all installations | 5 min | [ ] |
| +0:45 | Create directory structure | 5 min | [ ] |
| +0:50 | **BREAK** | 10 min | [ ] |

### Block 2: Database + Cloudflare (Start + 1:00 to 1:45)

| Time | Task | Duration | Status |
|------|------|----------|--------|
| +1:00 | Create PostgreSQL user & database | 10 min | [ ] |
| +1:10 | Enable PostgreSQL & Redis services | 5 min | [ ] |
| +1:15 | Test database connection | 5 min | [ ] |
| +1:20 | Add domain to Cloudflare | 10 min | [ ] |
| +1:30 | Configure DNS records (A, CNAME) | 10 min | [ ] |
| +1:40 | Configure SSL settings | 5 min | [ ] |

### Block 3: Lead Gen System (Start + 1:45 to 3:15)

| Time | Task | Duration | Status |
|------|------|----------|--------|
| +1:45 | Create Python virtual environment | 5 min | [ ] |
| +1:50 | Upload credentials to VPS | 5 min | [ ] |
| +1:55 | Create app file structure | 15 min | [ ] |
| +2:10 | Create requirements.txt | 5 min | [ ] |
| +2:15 | Install Python dependencies | 10 min | [ ] |
| +2:25 | Create database models | 15 min | [ ] |
| +2:40 | Create bot files (DFI, Email, LinkedIn) | 20 min | [ ] |
| +3:00 | Create utility files (AI, notifications) | 10 min | [ ] |
| +3:10 | **BREAK** | 10 min | [ ] |

### Block 4: WhatsApp + Services (Start + 3:20 to 4:20)

| Time | Task | Duration | Status |
|------|------|----------|--------|
| +3:20 | Initialize WhatsApp gateway (npm) | 5 min | [ ] |
| +3:25 | Create gateway server code | 10 min | [ ] |
| +3:35 | Start gateway & scan QR code | 10 min | [ ] |
| +3:45 | Create Supervisor configs (4 services) | 15 min | [ ] |
| +4:00 | Start all services | 5 min | [ ] |
| +4:05 | Create Nginx config | 10 min | [ ] |
| +4:15 | Enable Nginx site & reload | 5 min | [ ] |

### Block 5: Testing + Go Live (Start + 4:20 to 5:00)

| Time | Task | Duration | Status |
|------|------|----------|--------|
| +4:20 | Check all services running | 5 min | [ ] |
| +4:25 | Test API endpoint | 5 min | [ ] |
| +4:30 | Test Telegram notification | 5 min | [ ] |
| +4:35 | Test WhatsApp notification | 5 min | [ ] |
| +4:40 | Test DFI Monitor (dry run) | 5 min | [ ] |
| +4:45 | Verify external HTTPS access | 5 min | [ ] |
| +4:50 | Confirm Cloudflare active | 5 min | [ ] |
| +4:55 | **DEPLOYMENT COMPLETE** | - | [ ] |

---

## POST-DEPLOYMENT MONITORING

### Day 1 (Same Day)
| Time | Task | Status |
|------|------|--------|
| +6 hrs | Check first DFI Monitor run | [ ] |
| +6 hrs | Verify Telegram daily summary | [ ] |
| +6 hrs | Check logs for errors | [ ] |

### Day 2
| Task | Status |
|------|--------|
| Verify cold email bot ran (check logs) | [ ] |
| Review any leads detected | [ ] |
| Check all services still running | [ ] |

### Day 3
| Task | Status |
|------|--------|
| First LinkedIn post should publish (Mon/Wed/Fri) | [ ] |
| Review lead quality | [ ] |
| Adjust targeting if needed | [ ] |

### Week 1
| Task | Status |
|------|--------|
| Review all leads collected | [ ] |
| Check email deliverability | [ ] |
| Review LinkedIn engagement | [ ] |
| Full system health check | [ ] |

---

## QUICK REFERENCE COMMANDS

### Start Deployment:
```bash
ssh root@72.61.201.237
```

### Upload Credentials:
```bash
scp ~/.jasper-secrets/CREDENTIALS.env root@72.61.201.237:/app/jasper-leads/.env
```

### Check Services:
```bash
supervisorctl status
```

### View Logs:
```bash
tail -f /var/log/jasper/*.log
```

### Test Notifications:
```bash
cd /app/jasper-leads && source venv/bin/activate
python -c "from app.utils.notifications import send_telegram; send_telegram('🧪 Test')"
```

---

## EMERGENCY CONTACTS

| Issue | Action |
|-------|--------|
| VPS down | Hostinger support |
| DNS issues | Cloudflare dashboard |
| Bot errors | Check `/var/log/jasper/` |
| Rollback needed | `supervisorctl stop all` + point DNS to Vercel |

---

## SIGN-OFF

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Deployment Lead | | | |
| Verified By | | | |

---

**Document Status:** Ready for scheduling
**Total Deployment Time:** ~5 hours
**Post-Deployment Monitoring:** 1 week
