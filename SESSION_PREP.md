# JASPER Session Prep

Execute this load sequence, then WAIT for task:

## 1. Read Context
- docs/FEATURE_INDEX.md
- jasper-crm/docs/ARCHITECTURE.md
- jasper-crm/docs/RUNBOOK.md

## 2. Check VPS Health
```bash
ssh root@72.61.201.237 'systemctl list-units --type=service | grep jasper && echo "" && curl -s http://localhost:8001/status'
```

## 3. Report Status
Summarize:
- Services running
- Health status
- Last backup age
- Any issues

## 4. Ready State
Say: "JASPER environment loaded. Ready for task."

Then STOP and wait for instructions.

---

## Agent Tools Available

### Ralph Wiggum
```
/ralph-wiggum:ralph-loop "task" --max-iterations 50 --promise "criteria"
```

### Parallel Sub-Agents
```
Spawn with Task():
Task("name", "description")
```

### Stop Condition
Auto-stops when TODO.md contains: SWARM_COMPLETE, ALL_TASKS_COMPLETE, or MISSION_COMPLETE
