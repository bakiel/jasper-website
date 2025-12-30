# Working Features - DO NOT BREAK

Last verified: 2024-12-30

## ✅ Core API (PROTECTED)
These endpoints MUST pass after ANY change:

| Endpoint | Method | Must Return |
|----------|--------|-------------|
| `/health` | GET | `{"status": "healthy"}` |
| `/health/detailed` | GET | All checks pass |
| `/status` | GET | Services + disk + backup info |
| `/api/v1/blog/posts` | GET | Array of posts |
| `/api/v1/leads` | POST | Creates lead |
| `/docs` | GET | Swagger UI |

## ✅ Background Jobs (PROTECTED)
| Job | Schedule | Verify |
|-----|----------|--------|
| Incremental backup | 6am, 6pm | `/root/backups/` has recent file |
| Full backup | Sunday 3am | Weekly .tar.gz exists |
| Celery worker | Always | `systemctl status celery-worker` |
| Celery beat | Always | `systemctl status celery-beat` |

## ✅ Services (PROTECTED)
All must be `active (running)`:
- jasper-crm.service (port 8001)
- jasper-main-site.service (port 3005)
- celery-worker.service
- celery-beat.service

## ✅ Integrations (PROTECTED)
| Integration | Test |
|-------------|------|
| Contact form → CRM | Submit form, check `/api/v1/leads` |
| AI Router | POST to `/api/v1/chat` returns response |
| Blog SEO services | Posts have citations, links |

---

## Verification Command
Run this after ANY change:
```bash
ssh root@72.61.201.237 '/opt/jasper-crm/scripts/run_tests.sh'
```

All 12 tests must pass. If ANY fail → rollback immediately.

---

## Adding New Features

1. New feature goes in NEW file (don't modify working files unless necessary)
2. New endpoint = new route file, import into main
3. Test new feature independently
4. Then test ALL existing features still work
5. Only then commit

## Modifying Existing Features

1. Create `.bak` of file first
2. Make minimal change
3. Run full test suite
4. If tests fail → `cp file.bak file` → restart
5. If tests pass → commit with descriptive message
