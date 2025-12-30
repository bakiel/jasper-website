# JASPER Development Environment

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

### Sub-Agents (Parallel)
```
Use Task() to spawn parallel agents:
- Task("agent-1", "task description")
- Task("agent-2", "task description")
```

### Stop Hooks
Configured in .claude/settings.local.json - stops when TODO.md contains COMPLETE

## Rules
1. Backup before changes
2. Test before deploy
3. Small changes, verify each
4. Check health after deploy

## Quick Commands
```bash
# Deploy
ssh root@72.61.201.237 '/opt/jasper-crm/scripts/deploy.sh'

# Health
ssh root@72.61.201.237 'curl -s http://localhost:8001/status'

# Logs
ssh root@72.61.201.237 'journalctl -u jasper-crm -f'

# Tests
ssh root@72.61.201.237 '/opt/jasper-crm/scripts/run_tests.sh'
```
