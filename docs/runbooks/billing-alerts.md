# Runbook: Cloud Provider Billing Alerts & Spend Management

## 1. Overview
To prevent unforeseen cloud spend spikes, denial-of-wallet attacks, or runaway database/bandwidth consumption, automated billing alerts and budget caps are configured across all third-party cloud infrastructure providers.

---

## 2. Configured Provider Budget Thresholds

| Provider | Service Tier | Monthly Budget | Alert Threshold 1 (Warn) | Alert Threshold 2 (Critical) | Action on Critical Threshold |
|---|---|---|---|---|---|
| **Vercel** | Frontend Edge Hosting | $40 / mo | $30 (75%) | $38 (95%) | Slack alert `#ops-billing`, auto-pause preview branch deployments |
| **Railway** | Backend Docker API & BullMQ | $50 / mo | $35 (70%) | $45 (90%) | Scaling cap locked at 4 instances |
| **AWS / Supabase** | PostgreSQL 16 (Multi-AZ) | $90 / mo | $65 (72%) | $85 (94%) | PagerDuty SEV-2 alert, investigate query connection spikes |
| **Upstash Redis** | Serverless Cache & Pub/Sub | $20 / mo | $12 (60%) | $18 (90%) | Fallback to in-memory TTL caching |
| **Cloudflare R2** | Rx Image Storage | $15 / mo | $10 (66%) | $14 (93%) | Image compression tier escalation |
| **Resend / SendGrid** | Transactional Pharmacy Email | $40 / mo | $25 (62%) | $35 (87%) | Throttle marketing emails; prioritize critical Rx alerts |

---

## 3. Automated Notification Routing
1. **Webhook Notification**: All providers dispatch webhook payloads to `https://api.admin.pharmico.com/api/v1/alerts/billing`.
2. **Slack Channel**: Alerts route directly to `#ops-infrastructure-billing`.
3. **Escalation**: PagerDuty triggers for on-call DevOps if spend reaches 95% within first 15 days of billing cycle.

---

## 4. Emergency Spend Mitigation Steps
If an alert triggers:
1. Check `docs/runbooks/incident.md` for active DDoS / traffic spike.
2. Inspect Redis command rate and slow query log in PostgreSQL.
3. Enable Cloudflare Under Attack Mode if traffic is malicious.
4. Scale down non-essential worker replicas using Railway CLI: `railway down worker-background`.
