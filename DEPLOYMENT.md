# JASPER Financial Architecture - Deployment Guide

## Overview

The JASPER system consists of three deployable applications:

| Application | Type | Domain | Vercel Project |
|------------|------|--------|----------------|
| jasper-api | FastAPI | api.jasperfinance.org | jasper-api |
| jasper-portal | FastAPI | portal-api.jasperfinance.org | jasper-portal |
| jasper-portal-frontend | Next.js | portal.jasperfinance.org | jasper-portal-frontend |

---

## Environment Variables

### jasper-api (Contact Form API)

Set these in Vercel Dashboard → jasper-api → Settings → Environment Variables:

| Variable | Type | Description |
|----------|------|-------------|
| `DATABASE_URL` | Secret | PostgreSQL connection string |
| `SECRET_KEY` | Secret | JWT signing key (generate with `openssl rand -hex 32`) |
| `DEBUG` | Plain | Set to `false` for production |
| `ALLOWED_ORIGINS` | Plain | `https://jasperfinance.org,https://www.jasperfinance.org` |

### jasper-portal (Admin API)

Set these in Vercel Dashboard → jasper-portal → Settings → Environment Variables:

| Variable | Type | Description |
|----------|------|-------------|
| `DATABASE_URL` | Secret | PostgreSQL connection string |
| `SECRET_KEY` | Secret | JWT signing key (generate with `openssl rand -hex 32`) |
| `SMTP_HOST` | Plain | Email server host (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | Plain | Email server port (e.g., `587`) |
| `SMTP_USER` | Secret | Email username |
| `SMTP_PASSWORD` | Secret | Email password or app password |
| `OPENROUTER_API_KEY` | Secret | OpenRouter API key for AI features |
| `DEBUG` | Plain | Set to `false` for production |

### jasper-portal-frontend (Admin Dashboard)

Set these in Vercel Dashboard → jasper-portal-frontend → Settings → Environment Variables:

| Variable | Type | Description |
|----------|------|-------------|
| `NEXT_PUBLIC_API_URL` | Plain | `https://portal-api.jasperfinance.org` |

---

## Database Setup

### Option 1: Vercel Postgres (Recommended)
1. Go to Vercel Dashboard → Storage → Create Database → Postgres
2. Connect to your projects
3. The `DATABASE_URL` will be automatically set

### Option 2: External PostgreSQL
1. Use any PostgreSQL provider (Supabase, Neon, Railway, etc.)
2. Get the connection string
3. Add as `DATABASE_URL` environment variable

### Database Migration
After deployment, run migrations:
```bash
# For jasper-portal
cd jasper-portal
vercel env pull .env.local
source venv/bin/activate
alembic upgrade head
```

---

## Deployment Steps

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy jasper-api (Contact Form)
```bash
cd jasper-api
vercel --prod
```

### 4. Deploy jasper-portal (Admin API)
```bash
cd jasper-portal
vercel --prod
```

### 5. Deploy jasper-portal-frontend (Admin Dashboard)
```bash
cd jasper-portal-frontend
vercel --prod
```

---

## Domain Configuration

In Vercel Dashboard → Project → Settings → Domains:

1. **jasper-api**: Add `api.jasperfinance.org`
2. **jasper-portal**: Add `portal-api.jasperfinance.org`
3. **jasper-portal-frontend**: Add `portal.jasperfinance.org`

### DNS Records
Add these DNS records at your domain registrar:

| Type | Name | Value |
|------|------|-------|
| CNAME | api | cname.vercel-dns.com |
| CNAME | portal-api | cname.vercel-dns.com |
| CNAME | portal | cname.vercel-dns.com |

---

## Post-Deployment Checklist

- [ ] Environment variables configured in Vercel dashboard
- [ ] Database connected and migrations run
- [ ] Custom domains configured
- [ ] SSL certificates verified (automatic via Vercel)
- [ ] Test health endpoints:
  - `https://api.jasperfinance.org/health`
  - `https://portal-api.jasperfinance.org/health`
  - `https://portal.jasperfinance.org`
- [ ] Test admin login at `https://portal.jasperfinance.org/login`
- [ ] Test contact form submission

---

## Default Admin Credentials

**Initial Admin Account** (change password after first login):
- Email: `admin@jasperfinance.org`
- Password: `JasperAdmin2025!`

---

## Troubleshooting

### API Returns 500 Error
- Check Vercel Functions logs in dashboard
- Verify DATABASE_URL is correctly set
- Ensure database is accessible from Vercel

### CORS Errors
- Verify CORS headers in vercel.json
- Check ALLOWED_ORIGINS environment variable

### Authentication Issues
- Verify SECRET_KEY is consistent across deployments
- Check token expiration settings
- Verify API URL in frontend matches backend

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in requirements.txt / package.json
- Verify Python version (3.11) in vercel.json

---

## Quick Deploy Commands

```bash
# Deploy all applications at once
cd jasper-financial-architecture

# Deploy API
cd jasper-api && vercel --prod && cd ..

# Deploy Portal Backend
cd jasper-portal && vercel --prod && cd ..

# Deploy Portal Frontend
cd jasper-portal-frontend && vercel --prod && cd ..
```
