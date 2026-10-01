# ADR 0003: Redis Pub/Sub & BullMQ for Real-Time Events and Cache Invalidation

## Status
Accepted

## Context
The admin control center must coordinate with the storefront in real time:
1. When new orders are placed or prescriptions uploaded on the storefront, pharmacists and fulfillment staff need instant notification without manual polling.
2. When an admin updates catalog pricing, creates coupons, or modifies batch stock, the storefront's Next.js ISR (Incremental Static Regeneration) cache must be purged immediately so customers see up-to-date information.
3. Heavy background operations (e.g., transactional emails, PDF invoices, audit log flushing) should not block HTTP request/response lifecycles.

## Decision
We deploy **Redis 7** as the unified messaging, caching, and queuing engine:
1. **Redis Pub/Sub**: Channel `store:orders` ingests incoming storefront events (`order.created`, `prescription.uploaded`, `payment.captured`). Channel `store:events` broadcasts cache invalidation triggers to the storefront.
2. **Server-Sent Events (SSE)**: The Admin API provides an SSE stream (`/api/v1/events`) connected to the Redis pub/sub listener, pushing live notifications to connected admin browsers with zero polling latency.
3. **BullMQ Worker**: Background tasks (email dispatch, retryable ISR webhook calls, batch audit log flush) run through durable BullMQ queues (`email-queue`, `revalidation-queue`, `audit-queue`) with exponential backoff and dead-letter queueing.
4. **Graceful Standalone Fallback**: If Redis is offline during local development, the API gracefully operates in standalone mode without crashes or blocking timeouts.

## Alternatives Considered
- **Apache Kafka / RabbitMQ**: Rejected because of excessive resource consumption, operational overhead, and overkill for the required throughput (~100 events/sec peak).
- **HTTP Polling from Admin Browser**: Rejected because constant interval polling (e.g., every 3s across 50 admin tabs) wastes server CPU and database connection bandwidth.

## Consequences
- **Positive**:
  - Sub-100ms real-time event delivery to admin dashboards.
  - Zero admin UI latency for heavy background tasks.
  - Resilience: if the storefront is temporarily down during a cache purge, BullMQ automatically retries up to 5 times.
- **Negative / Constraints**:
  - Requires maintaining a Redis instance (Upstash or Redis Cloud in production).
