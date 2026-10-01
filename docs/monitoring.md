# Production Monitoring, Health Checks & Alerting Rules

## 1. Health Check Architecture

The API exposes two distinct health check endpoints:

### A. Shallow Liveness Check: `GET /api/health/live`
- **Purpose**: Used by Kubernetes, Docker, or Railway load balancers to verify process responsiveness.
- **Latency**: < 1ms.
- **Payload**:
  ```json
  { "status": "alive", "uptimeSeconds": 1420 }
  ```

### B. Deep Component Readiness Check: `GET /api/health`
- **Purpose**: Verifies that downstream services (PostgreSQL, Redis, BullMQ) are healthy and accepting connections.
- **Latency**: 5–25ms.
- **Payload**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-10-01T11:05:00.000Z",
    "components": {
      "database": { "status": "connected", "latencyMs": 4.1 },
      "redis": { "status": "connected", "latencyMs": 1.2 },
      "bullmq": { "status": "active", "activeJobs": 0 }
    }
  }
  ```

---

## 2. Technical & Business Metrics Thresholds

| Metric | Category | Healthy Baseline | Warning Threshold | Critical Alert Threshold |
|---|---|---|---|---|
| **API Latency (p95)** | Technical | < 150ms | > 500ms for 5 mins | > 1,500ms for 3 mins |
| **HTTP 5xx Error Rate** | Technical | < 0.05% | > 1.0% of requests | > 3.0% of requests |
| **PostgreSQL Connection Pool** | Technical | < 40% utilized | > 75% pool exhaustion | > 90% pool exhaustion |
| **BullMQ Failed Jobs** | Technical | 0 failures | > 5 failed jobs / hour | > 25 failed jobs / hour |
| **Pending Rx Review Backlog**| Business | < 15 prescriptions | > 50 pending > 2 hours | > 100 pending > 4 hours |
| **Stuck Order State Machine** | Business | 0 stuck orders | > 3 orders stuck in PENDING | > 10 orders stuck |

---

## 3. Escalation Rules & Notification Routing

| Severity | Definition | Notification Channel | Response SLA |
|---|---|---|---|
| **SEV-1 (Critical)** | Complete API outage, database down, or prescription approval broken. | PagerDuty / Phone Call + Slack `#ops-critical` | **< 15 minutes** |
| **SEV-2 (High)** | Degradation in ISR cache purge, slow queries, elevated error rates. | Slack `#ops-alerts` + Email | **< 1 hour** |
| **SEV-3 (Low)** | Non-blocking background worker retry, single failed transactional email. | Slack `#ops-log` | **Next business day** |
