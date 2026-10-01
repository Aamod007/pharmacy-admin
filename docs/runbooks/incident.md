# Runbook: Incident Response & Post-Mortem Process

## 1. Incident Severity Definitions

- **SEV-1 (Critical Outage)**: System down or core clinical flow impaired (e.g. pharmacists cannot approve prescriptions, inventory batches not allocating, database unreachable).
- **SEV-2 (Major Degradation)**: High latency (p95 > 2s), Redis pub/sub queue backlogged, storefront cache invalidation lagging.
- **SEV-3 (Minor Incident)**: Low-impact edge-case bug, cosmetic UI glitches, isolated email bounce.

---

## 2. Emergency Incident Response Checklist

```
[1. DETECT] Alert fires or user reports outage
     │
[2. TRIAGE] On-call engineer assigns SEV level (< 5 mins)
     │
[3. COMMUNICATE] Post initial status page notice: "Investigating" (< 10 mins)
     │
[4. MITIGATE] Apply fix, rollback release, or enable failover (< 30 mins)
     │
[5. RESOLVE] Verify /api/health and all metrics normal
     │
[6. POST-MORTEM] Publish blameless root-cause review within 48 hours
```

---

## 3. Incident Customer & Staff Communication Templates

### A. SEV-1 Initial Notification (Status Page / Staff Banner)
> **Subject**: [INVESTIGATING] Pharmico Admin Dashboard Connectivity Issues
> **Message**: We are actively investigating an issue affecting the admin control center and prescription review queue. Our engineering team is deployed to resolve this. Next update will be provided within 20 minutes.

### B. SEV-1 Resolution Notification
> **Subject**: [RESOLVED] Pharmico Admin Dashboard Restored
> **Message**: The service disruption impacting the administration panel has been resolved as of 11:35 UTC. All prescription review actions and inventory reservations are operating normally. A full post-mortem will be published within 48 hours.

---

## 4. Blameless Post-Mortem Template

Save completed post-mortems under `/docs/incidents/YYYY-MM-DD-title.md`:

```markdown
# Post-Mortem: [Incident Title]
**Date**: YYYY-MM-DD  
**Severity**: SEV-1 / SEV-2  
**Incident Commander**: [Name]  
**Duration**: XX minutes  

## 1. Summary
[2-3 sentence overview of what broke, customer impact, and how it was resolved.]

## 2. Timeline (UTC)
- **11:02**: Datadog alert triggered on elevated 500 error rate.
- **11:05**: Incident Commander assigned and opened war room.
- **11:15**: Root cause identified (e.g. database connection pool saturation).
- **11:22**: Mitigation applied (connection pool size expanded; stale idle connections killed).
- **11:30**: Metrics stabilized; incident resolved.

## 3. Root Cause
[Technical explanation of why the failure occurred.]

## 4. What Went Well vs. What Went Poorly
- **Went Well**: Health check alerted within 90 seconds.
- **Went Poorly**: Lack of automated circuit-breaker allowed queue buildup.

## 5. Preventative Action Items
| Action Item | Owner | Target Date |
|---|---|---|
| Implement connection pool circuit breaker | Tech Lead | Next Sprint |
| Add auto-scaling trigger on RDS CPU | DevOps | End of Week |
```
