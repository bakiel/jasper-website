# JASPER Financial Architecture - Deployment Guide

## Overview

The JASPER system runs on a Hostinger VPS (72.61.201.237) with Cloudflare for DNS and SSL termination.

### Applications

| Application | Type | Domain | Port | PM2 Name |
|------------|------|--------|------|----------|
| jasper-api | Express/Node.js | api.jasperfinance.org | 3003 | jasper-api |
| jasper-portal-frontend | Next.js | portal.jasperfinance.org | 3002 | jasper-portal |
| jasper-client-portal | Next.js | client.jasperfinance.org | 3004 | jasper-client |
| jasper-leadgen | FastAPI | leads.jasperfinance.org | 8000 | (Python) |

---

## VPS Architecture

```
                    ┌──────────────────────────────────────────────────────────┐
                    │                     CLOUDFLARE                            │
                    │  (DNS + CDN + SSL Termination)                            │
                    └──────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            VPS: 72.61.201.237                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌──────────────────────────────────────────────────────────────────────────────┐  │
│   │                           TRAEFIK (Docker)                                    │  │
│   │                      Ports 80, 443 → Internal routing                        │  │
│   └──────────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                              │
│           ┌───────────────────────────┼───────────────────────────┐                 │
│           ▼                           ▼                           ▼                 │
│   ┌───────────────┐         ┌───────────────┐           ┌───────────────┐          │
│   │  jasper-api   │         │ jasper-portal │           │ jasper-client │          │
│   │    :3003      │         │    :3002      │           │    :3004      │          │
│   │   Express     │         │   Next.js     │           │   Next.js     │          │
│   └───────────────┘         └───────────────┘           └───────────────┘          │
│                                                                                      │
│                          Managed by PM2                                              │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## PM2 Management

### View Status
```bash
ssh root@72.61.201.237
cd /root/jasper-financial-architecture
pm2 status
```

### Restart All Applications
```bash
pm2 restart all
```

### Restart Specific Application
```bash
pm2 restart jasper-api
pm2 restart jasper-portal
pm2 restart jasper-client
```

### View Logs
```bash
pm2 logs jasper-api
pm2 logs jasper-portal --lines 100
```

### Save PM2 Configuration
```bash
pm2 save
```

---

## Traefik Configuration

Configuration file: `/root/traefik/jasper.yml`

### Reload Configuration
Traefik watches the dynamic config directory and auto-reloads. If needed, restart:
```bash
cd /root
docker compose restart traefik
```

### View Traefik Logs
```bash
docker logs root-traefik-1 --tail 50
```

---

## Environment Variables

### jasper-api (.env.production)

Location: `/root/jasper-financial-architecture/jasper-api/.env.production`

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | JWT signing key |
| `RESEND_API_KEY` | Resend email service API key |
| `ADMIN_NOTIFICATION_EMAIL` | Admin email for notifications |

### jasper-portal-frontend (.env.production)

Location: `/root/jasper-financial-architecture/jasper-portal-frontend/.env.production`

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://api.jasperfinance.org` |
| `NEXTAUTH_URL` | `https://portal.jasperfinance.org` |
| `NEXTAUTH_SECRET` | NextAuth secret key |

### jasper-client-portal (.env.production)

Location: `/root/jasper-financial-architecture/jasper-client-portal/.env.production`

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://api.jasperfinance.org` |
| `NEXTAUTH_URL` | `https://client.jasperfinance.org` |
| `NEXTAUTH_SECRET` | NextAuth secret key |

---

## Deployment Steps

### 1. SSH to VPS
```bash
ssh root@72.61.201.237
```

### 2. Pull Latest Code
```bash
cd /root/jasper-financial-architecture
git pull origin main
```

### 3. Install Dependencies (if needed)
```bash
# For jasper-api
cd jasper-api
npm install

# For jasper-portal-frontend
cd ../jasper-portal-frontend
npm install
npm run build

# For jasper-client-portal
cd ../jasper-client-portal
npm install
npm run build
```

### 4. Restart Applications
```bash
pm2 restart all
```

---

## DNS Configuration (Cloudflare)

| Subdomain | Type | Target | Proxy |
|-----------|------|--------|-------|
| api | A | 72.61.201.237 | Proxied |
| portal | A | 72.61.201.237 | Proxied |
| client | A | 72.61.201.237 | Proxied |
| leads | A | 72.61.201.237 | Proxied |

---

## Health Checks

### API Health
```bash
curl https://api.jasperfinance.org/health
```

Expected response:
```json
{"status":"healthy","service":"JASPER Contact API","timestamp":"..."}
```

### Portal Access
- Admin Portal: https://portal.jasperfinance.org
- Client Portal: https://client.jasperfinance.org

---

## Troubleshooting

### Application Not Responding
1. Check PM2 status: `pm2 status`
2. Check logs: `pm2 logs <app-name>`
3. Restart: `pm2 restart <app-name>`

### 502 Bad Gateway
1. Verify application is running: `pm2 status`
2. Check if port is listening: `netstat -tlnp | grep 300`
3. Check Traefik logs: `docker logs root-traefik-1`

### SSL/Certificate Issues
1. Verify Cloudflare SSL mode is "Full (strict)"
2. Check Traefik certificate logs
3. Ensure DNS is pointing to VPS IP

### Database Connection Issues
1. Verify DATABASE_URL in .env.production
2. Check Neon database status at console.neon.tech
3. Test connection from VPS:
   ```bash
   node -e "require('@neondatabase/serverless').neon(process.env.DATABASE_URL)('SELECT 1').then(console.log)"
   ```

---

## Quick Commands Reference

```bash
# SSH to server
ssh root@72.61.201.237

# Navigate to project
cd /root/jasper-financial-architecture

# PM2 commands
pm2 status                    # View all apps
pm2 restart all               # Restart all
pm2 logs jasper-api           # View API logs
pm2 logs jasper-portal        # View portal logs
pm2 logs jasper-client        # View client logs

# Traefik commands
docker logs root-traefik-1 --tail 50   # View logs
docker compose restart traefik          # Restart

# Git pull and deploy
git pull origin main
pm2 restart all
```

---

## Backup & Recovery

### PM2 Process List
```bash
pm2 save
# Saved to ~/.pm2/dump.pm2
```

### Restore PM2 Processes
```bash
pm2 resurrect
```

### Export Environment Files
```bash
# Backup all .env files
tar -czf env-backup.tar.gz \
  jasper-api/.env.production \
  jasper-portal-frontend/.env.production \
  jasper-client-portal/.env.production
```

---

*Last Updated: December 13, 2025*
*VPS: Hostinger 72.61.201.237*
*Managed by: PM2 + Traefik + Cloudflare*
