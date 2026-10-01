# 4. Redis Pub/Sub, BullMQ, and ISR Revalidation

Date: 2026-10-01
Status: Accepted

## Context
When an administrator modifies product catalog data, updates stock batches, or creates promotional coupons, the customer storefront must reflect changes immediately without serving stale cached pages.

## Decision
We implement a dual-layer sync protocol:
1. **Redis Pub/Sub Channel (`store:events`)**: Emits high-priority event payloads for instantaneous worker processing.
2. **On-Demand Next.js ISR Revalidation (`/api/revalidate`)**: `admin-api` dispatches an authenticated HTTP POST with revalidation tags (e.g. `['products', 'inventory']`) to the storefront URL with multi-port localhost fallback (3000 / 3001).

## Consequences
- **Positive**: Zero stale inventory for customers while retaining fast CDN edge caching.
