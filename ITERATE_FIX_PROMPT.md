# JASPER Stabilization - Iterate & Fix Mode

## 🛑 CRITICAL RULES

1. **ITERATE, DON'T CREATE** - Fix existing code, never start new builds
2. **VERIFY BEFORE CHANGE** - Check what exists first
3. **ONE FIX AT A TIME** - Small, testable changes
4. **ROLLBACK READY** - Always have backup before touching anything

---

## STOP HOOK CONDITION

This session continues until ALL of these are TRUE:
- [ ] PHASE_1_COMPLETE in TODO.md
- [ ] PHASE_2_COMPLETE in TODO.md  
- [ ] PHASE_3_COMPLETE in TODO.md
- [ ] PHASE_4_COMPLETE in TODO.md
- [ ] PHASE_5_COMPLETE in TODO.md
- [ ] ALL_PHASES_VERIFIED in TODO.md

---

## PHASE 1: SAFETY (Backups + Health)

### Step 1.1: First, take manual backup NOW
```bash
ssh root@72.61.201.237 'mkdir -p /root/backups && tar -czf /root/backups/jasper-pre-stabilization-$(date +%Y%m%d_%H%M%S).tar.gz /opt/jasper-crm/data/'
```
**VERIFY**: `ssh root@72.61.201.237 'ls -la /root/backups/'`

### Step 1.2: Check what backup scripts already exist
```bash
ssh root@72.61.201.237 'ls -la /opt/jasper-crm/scripts/ 2>/dev/null || echo "No scripts dir"'
ssh root@72.61.201.237 'crontab -l 2>/dev/null || echo "No crontab"'
```
**IF EXISTS**: Review and enhance
**IF NOT**: Create minimal backup.sh

### Step 1.3: Check existing health endpoint
```bash
curl -s https://api.jasperfinance.org/api/v1/health | jq .
```
**IF WORKS**: Note what it returns, enhance if needed
**IF BROKEN**: Fix it, don't replace it

### Step 1.4: Check log rotation
```bash
ssh root@72.61.201.237 'cat /etc/logrotate.d/jasper 2>/dev/null || echo "No rotation config"'
```
**IF EXISTS**: Verify it's correct
**IF NOT**: Add minimal config

### ✅ PHASE 1 COMPLETE WHEN:
- `/root/backups/` has backup files
- Cron runs backup twice daily
- Health endpoint returns comprehensive status
- Log rotation configured

---

## PHASE 2: MONITORING

### Step 2.1: Check what monitoring exists
```bash
ssh root@72.61.201.237 'grep -r "status\|health\|monitor" /opt/jasper-crm/routes/ 2>/dev/null | head -20'
```

### Step 2.2: Check if /status or /health/detailed exists
```bash
curl -s https://api.jasperfinance.org/api/v1/status | jq .
curl -s https://api.jasperfinance.org/api/v1/health/detailed | jq .
```
**IF EXISTS**: Document it
**IF NOT**: Add to existing health.py route file

### Step 2.3: Create UptimeRobot instructions (documentation only)
Don't create new systems - just document how to set up free monitoring.

### ✅ PHASE 2 COMPLETE WHEN:
- Status endpoint works
- UptimeRobot setup documented
- Can see service health at a glance

---

## PHASE 3: TESTS

### Step 3.1: Check existing tests
```bash
ls -la jasper-crm/tests/ 2>/dev/null || echo "No tests dir"
find jasper-crm -name "test_*.py" -o -name "*_test.py" 2>/dev/null
```

### Step 3.2: Check existing routes to test
```bash
ls jasper-crm/routes/
grep -h "@router" jasper-crm/routes/*.py | head -20
```

### Step 3.3: Add tests for EXISTING endpoints only
Don't create new features - just test what's already there.

### Step 3.4: Run tests and fix failures
```bash
cd jasper-crm && python -m pytest tests/ -v
```
**FIX FAILURES** - Don't add new code, fix broken code

### ✅ PHASE 3 COMPLETE WHEN:
- Tests exist for critical paths
- All tests pass
- No new features added

---

## PHASE 4: DOCUMENTATION

### Step 4.1: Check existing docs
```bash
ls -la *.md docs/*.md 2>/dev/null
```

### Step 4.2: Verify API docs accessible
```bash
curl -s https://api.jasperfinance.org/docs | head -5
curl -s https://api.jasperfinance.org/redoc | head -5
```

### Step 4.3: Create RUNBOOK.md and ARCHITECTURE.md
Pure documentation - no code changes.

### ✅ PHASE 4 COMPLETE WHEN:
- RUNBOOK.md exists with operations procedures
- ARCHITECTURE.md exists with system overview
- /docs and /redoc are accessible

---

## PHASE 5: CI/CD

### Step 5.1: Check existing GitHub Actions
```bash
ls -la .github/workflows/ 2>/dev/null
cat .github/workflows/*.yml 2>/dev/null
```

### Step 5.2: Check existing deploy scripts
```bash
ssh root@72.61.201.237 'ls -la /opt/jasper-crm/scripts/deploy* 2>/dev/null'
```

### Step 5.3: If no CI/CD exists, create minimal workflow
**MINIMAL** - Just test and deploy, nothing fancy.

### ✅ PHASE 5 COMPLETE WHEN:
- GitHub Actions workflow exists
- Deploy script exists on VPS
- Push triggers test → deploy pipeline

---

## ITERATION PROTOCOL

For EACH phase:

1. **DISCOVER** - What exists already?
2. **VERIFY** - Does it work?
3. **FIX** - If broken, fix it
4. **ENHANCE** - Only if working and needs improvement
5. **TEST** - Verify the fix works
6. **DOCUMENT** - Update TODO.md

**NEVER**:
- Start building new systems
- Replace working code with "better" code
- Add features not in the stabilization list
- Skip verification steps

---

## TODO TRACKER

Update this after each step:

```
## Phase 1: Safety
- [ ] Manual backup taken
- [ ] Backup script created/verified
- [ ] Cron configured
- [ ] Health endpoint enhanced
- [ ] Log rotation configured
- PHASE_1_COMPLETE

## Phase 2: Monitoring  
- [ ] Status endpoint working
- [ ] UptimeRobot documented
- PHASE_2_COMPLETE

## Phase 3: Tests
- [ ] Test directory exists
- [ ] Health tests pass
- [ ] Blog tests pass
- [ ] Contact form tests pass
- [ ] All tests green
- PHASE_3_COMPLETE

## Phase 4: Documentation
- [ ] RUNBOOK.md created
- [ ] ARCHITECTURE.md created
- [ ] /docs accessible
- [ ] /redoc accessible
- PHASE_4_COMPLETE

## Phase 5: CI/CD
- [ ] GitHub Actions workflow
- [ ] Deploy script on VPS
- [ ] Pipeline tested
- PHASE_5_COMPLETE

ALL_PHASES_VERIFIED
```
