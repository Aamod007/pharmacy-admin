# Scaling Strategy, Load Testing & High-Throughput Readiness

## 1. Stateless Architecture for Horizontal Scaling
To scale horizontally across multiple Docker containers or cloud instances:
1. **Zero Server-Bound Sessions**: Session IDs and JWT tokens are verified either statelessly or against PostgreSQL/Redis. Any instance can service any admin request.
2. **Zero In-Memory File Storage**: Prescription uploads stream directly from client to Cloudflare R2 / S3 via pre-signed URLs. The API container never stores binary files on local disk.
3. **Distributed Rate Limiting**: Request counters are synchronized across instances via Redis instead of local Node.js variables.

---

## 2. PostgreSQL Connection Pooling Strategy

Under high concurrent request volume, direct database connections can quickly saturate PostgreSQL's `max_connections` (typically 100 on standard RDS tiers).

```
[Multiple API Containers (5 instances)]
       │ (10 connections each = 50 conns)
       ▼
 [PgBouncer Connection Pooler / Prisma Accelerate]
       │ (Maintains persistent connection pool of 20-30 connections)
       ▼
 [PostgreSQL 16 Engine (medico_db)]
```

### Prisma Configuration in Production:
- Configure `connection_limit` in connection string:
  ```
  DATABASE_URL="postgresql://user:pass@db.pharmico.com:5432/medico_db?connection_limit=15&pool_timeout=10"
  ```
- Use PgBouncer in **Transaction Pooling** mode to reuse database sockets efficiently across short-lived HTTP requests.

---

## 3. k6 Automated Load Testing Script

Save this script as `tests/load/k6-prescription-test.js` to benchmark peak concurrency:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 20 },  // Ramp-up to 20 concurrent pharmacists
    { duration: '5m', target: 50 },  // Sustain peak load
    { duration: '2m', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% of requests must complete within 300ms
    http_req_failed: ['rate<0.01'],    // Error rate must stay below 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5001/api/v1';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${__ENV.ADMIN_JWT_TOKEN}`,
  };

  // Test 1: Query Prescription Queue
  const res = http.get(`${BASE_URL}/prescriptions?status=PENDING&limit=20`, { headers });
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response under 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1);
}
```

---

## 4. Bottleneck Analysis & Optimization Roadmap

| Traffic Tier | Primary Expected Bottleneck | Architectural Fix |
|---|---|---|
| **1x (Launch)** | Redis cold-boot latency or unindexed queries | Add composite indexes on `Batch(productId, expiryDate)` and cache auth profiles. *(Done)* |
| **5x Scale** | PostgreSQL connection pool saturation | Introduce PgBouncer connection pooler in front of RDS. |
| **10x Scale** | High-volume order state event pub/sub contention | Partition Redis pub/sub streams into separate channels (`orders:urgent`, `orders:standard`). |
| **25x Scale** | Prescription image inspection bandwidth | Cache processed thumbnails at Cloudflare Edge CDN with authenticated token signing. |
