# JASPER Development Environment

## ⚠️ PRIME DIRECTIVE
**PRESERVE WHAT WORKS. Iterate, don't rebuild.**

Before ANY code change:
1. Verify current functionality WORKS
2. Make ONE small change
3. Test that change
4. Confirm nothing broke
5. Then next change

**NEVER delete working code to "improve" it. Extend, don't replace.**

---

## Pre-Flight Checklist (MANDATORY)

Before touching ANY file:
```bash
# 1. Check it's not broken first
ssh root@72.61.201.237 'curl -s http://localhost:8001/health'

# 2. Backup the specific file you're changing
ssh root@72.61.201.237 'cp /path/to/file.py /path/to/file.py.bak'

# 3. Note what currently works
# ASK USER: "The current [feature] does [X]. I will add [Y]. Confirm?"
```

---

## The Dam Wall Rules

### 🚫 NEVER
- Delete a working file to rewrite it
- Refactor multiple files at once
- "Clean up" code that wasn't part of the task
- Replace a working implementation with a "better" one
- Remove functionality to add functionality

### ✅ ALWAYS
- Add new code alongside existing code
- Feature flags for new functionality
- Test the OLD behavior still works after changes
- One file, one change, one test cycle
- Ask before removing ANY existing code

---

## Change Protocol

### Small Change (< 20 lines)
1. Show the EXACT lines changing
2. Get approval
3. Make change
4. Test
5. Report result

### Medium Change (20-100 lines)
1. Explain what exists and works
2. Explain what you'll ADD (not replace)
3. Get approval
4. Make change in stages
5. Test after each stage

### Large Change (> 100 lines)
1. STOP - break it into smaller changes
2. Create a plan with checkpoints
3. Get approval for plan
4. Execute one checkpoint at a time
5. User confirms each checkpoint before next

---

## Rollback Ready

Every change must be reversible:
```bash
# Before changing file.py
cp file.py file.py.pre-change

# If it breaks
cp file.py.pre-change file.py
systemctl restart jasper-crm
```

---

## Health Gates

After ANY change, verify:
```bash
ssh root@72.61.201.237 'curl -s http://localhost:8001/health | jq .'
```

If health check fails → **STOP** → rollback → report

---

## Auto-Load Context
Read these before any task:
- docs/FEATURE_INDEX.md
- jasper-crm/docs/ARCHITECTURE.md
- jasper-crm/docs/RUNBOOK.md

## Infrastructure
- **VPS:** root@72.61.201.237
- **CRM API:** port 8001
- **Marketing Site:** port 3005
- **Backups:** /root/backups/

## Agent Tools

### Ralph Wiggum (Autonomous Loop)
```
/ralph-wiggum:ralph-loop "task" --max-iterations 50 --promise "done criteria"
```
**Ralph MUST follow Dam Wall Rules** - small iterations, test each

### Sub-Agents (Parallel)
Each agent works on SEPARATE files only - no overlapping edits

### Stop Hooks
Auto-stops when TODO.md contains: MISSION_COMPLETE

## Quick Commands
```bash
# Health check (DO THIS CONSTANTLY)
ssh root@72.61.201.237 'curl -s http://localhost:8001/status'

# Backup before changes
ssh root@72.61.201.237 '/opt/jasper-crm/scripts/backup_all.sh'

# Test suite
ssh root@72.61.201.237 '/opt/jasper-crm/scripts/run_tests.sh'

# Logs if something breaks
ssh root@72.61.201.237 'journalctl -u jasper-crm -n 50'
```
