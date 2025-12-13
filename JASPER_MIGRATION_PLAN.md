# JASPER Migration Plan
## Complete Deployment to Hostinger VPS

**Created:** December 2025
**VPS:** 72.61.201.237
**Domain:** jasperfinance.org
**Estimated Time:** 4-6 hours

---

## OVERVIEW

### What We're Deploying:

| System | Priority | Description |
|--------|----------|-------------|
| **Lead Gen System** | HIGH | 3 bots (DFI Monitor, Cold Email, LinkedIn) |
| **WhatsApp Gateway** | HIGH | Real-time alerts via whatsapp-web.js |
| **Telegram Notifications** | HIGH | Full alert details |
| **PostgreSQL Database** | HIGH | Lead storage and tracking |
| **Redis + Celery** | HIGH | Task scheduling and queuing |
| **Nginx Reverse Proxy** | HIGH | Route traffic to services |
| **Cloudflare CDN** | MEDIUM | SSL, caching, DDoS protection |

### What Stays on Vercel (For Now):
- jasper-portal-frontend (main website)
- jasper-api (backend API)

---

## PHASE 1: VPS INFRASTRUCTURE
**Time:** 45 minutes

### 1.1 Connect to VPS
```bash
ssh root@72.61.201.237
```

### 1.2 System Update
```bash
apt update && apt upgrade -y
```

### 1.3 Install Core Dependencies
```bash
# Python 3.12
apt install -y software-properties-common
add-apt-repository -y ppa:deadsnakes/ppa
apt install -y python3.12 python3.12-venv python3.12-dev python3-pip

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# PostgreSQL
apt install -y postgresql postgresql-contrib

# Redis
apt install -y redis-server

# Nginx
apt install -y nginx

# Supervisor (process management)
apt install -y supervisor

# Chromium (for WhatsApp headless)
apt install -y chromium-browser

# Build tools
apt install -y build-essential git curl wget
```

### 1.4 Verify Installations
```bash
python3.12 --version  # Python 3.12.x
node --version        # v18.x.x
psql --version        # PostgreSQL 14+
redis-cli ping        # PONG
nginx -v              # nginx/1.x.x
```

### 1.5 Create Directory Structure
```bash
mkdir -p /app/jasper-leads
mkdir -p /app/whatsapp-gateway
mkdir -p /var/www/jasperfinance.org/static
mkdir -p /var/log/jasper
```

---

## PHASE 2: DATABASE SETUP
**Time:** 15 minutes

### 2.1 Configure PostgreSQL
```bash
sudo -u postgres psql << EOF
CREATE USER jasper WITH PASSWORD 'jasper_secure_pwd';
CREATE DATABASE jasper_leads OWNER jasper;
GRANT ALL PRIVILEGES ON DATABASE jasper_leads TO jasper;
\q
EOF
```

### 2.2 Enable Services
```bash
systemctl enable postgresql
systemctl enable redis-server
systemctl start postgresql
systemctl start redis-server
```

### 2.3 Test Database Connection
```bash
psql -U jasper -d jasper_leads -h localhost -c "SELECT 1;"
# Enter password: jasper_secure_pwd
```

---

## PHASE 3: CLOUDFLARE DNS
**Time:** 30 minutes (+ propagation wait)

### 3.1 Add Domain to Cloudflare
1. Login to Cloudflare dashboard
2. Add site: jasperfinance.org
3. Note the nameservers provided

### 3.2 Update Nameservers at Registrar
Update nameservers to Cloudflare's (at domain registrar)

### 3.3 Configure DNS Records
```
Type    Name    Content           Proxy
A       @       72.61.201.237     Proxied
CNAME   www     jasperfinance.org Proxied
A       api     72.61.201.237     Proxied
A       social  72.61.201.237     Proxied
A       portal  72.61.201.237     Proxied
A       client  72.61.201.237     Proxied
```

### 3.4 SSL Settings
- SSL/TLS → Full (strict)
- Edge Certificates → Always Use HTTPS: ON
- Edge Certificates → Automatic HTTPS Rewrites: ON

---

## PHASE 4: LEAD GEN SYSTEM
**Time:** 1.5 hours

### 4.1 Create Python Environment
```bash
cd /app/jasper-leads
python3.12 -m venv venv
source venv/bin/activate
```

### 4.2 Upload Credentials
```bash
# From local machine:
scp ~/.jasper-secrets/CREDENTIALS.env root@72.61.201.237:/app/jasper-leads/.env
```

### 4.3 Create Application Files
The Lead Gen system needs these files built:

```
/app/jasper-leads/
├── .env                      # Credentials (uploaded)
├── requirements.txt          # Dependencies
├── alembic.ini              # DB migrations config
├── alembic/
│   └── versions/            # Migration files
├── app/
│   ├── __init__.py
│   ├── config.py            # Settings from env
│   ├── db.py                # Database connection
│   ├── models.py            # SQLAlchemy models
│   ├── main.py              # FastAPI application
│   ├── celery_app.py        # Celery configuration
│   ├── bots/
│   │   ├── __init__.py
│   │   ├── dfi_monitor.py   # DFI/Funding monitor
│   │   ├── cold_email.py    # Cold email outreach
│   │   └── linkedin.py      # LinkedIn auto-post
│   └── utils/
│       ├── __init__.py
│       ├── ai.py            # OpenRouter integration
│       ├── notifications.py # Telegram + WhatsApp
│       └── email.py         # SMTP sending
└── supervisor/
    ├── celery_worker.conf
    ├── celery_beat.conf
    └── fastapi.conf
```

### 4.4 Install Dependencies
```bash
pip install -r requirements.txt
```

### 4.5 Run Database Migrations
```bash
alembic upgrade head
```

---

## PHASE 5: WHATSAPP GATEWAY
**Time:** 30 minutes

### 5.1 Initialize Node.js Project
```bash
cd /app/whatsapp-gateway
npm init -y
npm install whatsapp-web.js qrcode-terminal express
```

### 5.2 Create Gateway Server
Create `/app/whatsapp-gateway/index.js` with the WhatsApp gateway code.

### 5.3 Initial Setup (QR Code)
```bash
node index.js
# Scan QR code with WhatsApp when prompted
# Wait for "WhatsApp client ready!" message
# Ctrl+C to stop (will restart via Supervisor)
```

---

## PHASE 6: PROCESS MANAGEMENT
**Time:** 20 minutes

### 6.1 Celery Worker Config
Create `/etc/supervisor/conf.d/jasper_celery_worker.conf`:
```ini
[program:jasper_celery_worker]
command=/app/jasper-leads/venv/bin/celery -A app.celery_app worker --loglevel=info
directory=/app/jasper-leads
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/jasper/celery_worker.err.log
stdout_logfile=/var/log/jasper/celery_worker.out.log
```

### 6.2 Celery Beat Config
Create `/etc/supervisor/conf.d/jasper_celery_beat.conf`:
```ini
[program:jasper_celery_beat]
command=/app/jasper-leads/venv/bin/celery -A app.celery_app beat --loglevel=info
directory=/app/jasper-leads
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/jasper/celery_beat.err.log
stdout_logfile=/var/log/jasper/celery_beat.out.log
```

### 6.3 FastAPI Config
Create `/etc/supervisor/conf.d/jasper_fastapi.conf`:
```ini
[program:jasper_fastapi]
command=/app/jasper-leads/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
directory=/app/jasper-leads
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/jasper/fastapi.err.log
stdout_logfile=/var/log/jasper/fastapi.out.log
```

### 6.4 WhatsApp Gateway Config
Create `/etc/supervisor/conf.d/jasper_whatsapp.conf`:
```ini
[program:jasper_whatsapp]
command=/usr/bin/node index.js
directory=/app/whatsapp-gateway
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/jasper/whatsapp.err.log
stdout_logfile=/var/log/jasper/whatsapp.out.log
```

### 6.5 Start All Services
```bash
supervisorctl reread
supervisorctl update
supervisorctl start all
supervisorctl status
```

---

## PHASE 7: NGINX CONFIGURATION
**Time:** 15 minutes

### 7.1 Create Site Config
Create `/etc/nginx/sites-available/jasperfinance.org`:
```nginx
server {
    listen 80;
    server_name jasperfinance.org www.jasperfinance.org;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /var/www/jasperfinance.org/static/;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
    }
}

# API subdomain
server {
    listen 80;
    server_name api.jasperfinance.org;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7.2 Enable Site
```bash
ln -s /etc/nginx/sites-available/jasperfinance.org /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## PHASE 8: TESTING
**Time:** 30 minutes

### 8.1 Check Services
```bash
supervisorctl status
# All should show RUNNING
```

### 8.2 Test API
```bash
curl http://localhost:8000/health
# {"status": "ok"}
```

### 8.3 Test Telegram
```bash
cd /app/jasper-leads
source venv/bin/activate
python -c "from app.utils.notifications import send_telegram; send_telegram('🧪 JASPER Test Alert')"
# Check Telegram for message
```

### 8.4 Test WhatsApp
```bash
curl -X POST http://localhost:3001/api/send \
  -H "Content-Type: application/json" \
  -d '{"to": "27697278539", "message": "🧪 JASPER Test"}'
# Check WhatsApp for message
```

### 8.5 Test DFI Monitor (Dry Run)
```bash
python -c "from app.bots.dfi_monitor import monitor_dfi; monitor_dfi(dry_run=True)"
```

### 8.6 Verify External Access
- Visit https://jasperfinance.org
- Check for Cloudflare headers (`cf-ray`)
- Verify SSL certificate (green padlock)

---

## PHASE 9: GO LIVE
**Time:** 15 minutes

### 9.1 Enable Bot Schedules
Celery Beat will automatically run:
- DFI Monitor: Every 30 minutes
- Cold Email: Weekdays 8 AM SAST
- LinkedIn: Mon/Wed/Fri 10 AM SAST
- Daily Summary: 6 PM SAST

### 9.2 Monitor First Run
```bash
# Watch logs
tail -f /var/log/jasper/*.log

# Check Celery tasks
celery -A app.celery_app inspect active
celery -A app.celery_app inspect scheduled
```

### 9.3 Verify Alerts Received
Wait for first DFI Monitor run (max 30 min) and confirm:
- [ ] Telegram notification received
- [ ] WhatsApp ping received
- [ ] Database records created

---

## POST-DEPLOYMENT CHECKLIST

### Immediately After Deployment:
- [ ] All services running (`supervisorctl status`)
- [ ] Website accessible via HTTPS
- [ ] Telegram test message received
- [ ] WhatsApp test message received
- [ ] DFI Monitor dry run successful

### After 24 Hours:
- [ ] Daily summary received
- [ ] Leads detected and stored
- [ ] No errors in `/var/log/jasper/`

### After 1 Week:
- [ ] Cold emails sending (check outbox)
- [ ] LinkedIn posts publishing
- [ ] Lead quality review
- [ ] Adjust targeting if needed

---

## ROLLBACK PLAN

If critical issues occur:

1. **Stop all services:**
   ```bash
   supervisorctl stop all
   ```

2. **Cloudflare:** Point DNS back to Vercel (instant)

3. **Database backup:**
   ```bash
   pg_dump -U jasper jasper_leads > backup.sql
   ```

4. **Logs for debugging:**
   ```bash
   ls -la /var/log/jasper/
   ```

---

## CREDENTIALS REFERENCE

**Location:** `~/.jasper-secrets/CREDENTIALS.env`

To view during deployment:
```bash
cat ~/.jasper-secrets/CREDENTIALS.env
```

To copy to VPS:
```bash
scp ~/.jasper-secrets/CREDENTIALS.env root@72.61.201.237:/app/jasper-leads/.env
```

---

## ESTIMATED TIMELINE

| Phase | Task | Time |
|-------|------|------|
| 1 | VPS Infrastructure | 45 min |
| 2 | Database Setup | 15 min |
| 3 | Cloudflare DNS | 30 min |
| 4 | Lead Gen System | 90 min |
| 5 | WhatsApp Gateway | 30 min |
| 6 | Process Management | 20 min |
| 7 | Nginx Configuration | 15 min |
| 8 | Testing | 30 min |
| 9 | Go Live | 15 min |
| **TOTAL** | | **~5 hours** |

---

## NEXT ACTION

**Start deployment by running:**
```bash
ssh root@72.61.201.237
```

Then follow Phase 1 → Phase 9 in order.

---

**Document Status:** Ready for execution
**Last Updated:** December 2025
**Owner:** JASPER Financial Architecture
