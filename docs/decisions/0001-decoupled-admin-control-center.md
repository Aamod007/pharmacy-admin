# 1. Decoupled Admin Control Center Architecture

Date: 2026-10-01
Status: Accepted

## Context
The legacy application coupled the administrative dashboard directly inside the main customer storefront Next.js application (`apps/web/src/app/admin`). This introduced several issues:
1. Increased customer bundle sizes due to heavy administrative dependencies (charts, data tables, PDF generation, bulk uploaders).
2. Security risks from shared cookie domains and mixed customer/admin authentication routes.
3. Inability to independently deploy and scale operational staff tooling without triggering storefront downtime or cache invalidations.

## Decision
We decouple the administration platform entirely into a dedicated, standalone repository and architecture (`pharmacy-admin`) featuring:
- `apps/admin-web`: A dedicated Next.js 15 administrative single-page dashboard running on port 3002.
- `apps/admin-api`: A high-throughput Node.js/Express modular monolith backend running on port 5001.
- `packages/db`: A shared Prisma ORM client with full access to store tables and administrative extensions.
- `packages/shared`: Common TypeScript types, FEFO utilities, and event schemas.

## Alternatives Considered
- **Keep admin inside storefront monorepo**: Rejected due to bundle bloat, release cycle coupling, and increased attack surface.
- **Microservices per domain** (Order Service, Catalog Service, Prescription Service): Rejected as premature for current 50-admin operational scale; would introduce distributed transaction overhead.

## Consequences
- **Positive**: Independent deployments, isolated auth tokens, streamlined CI/CD, dedicated administrative security policies.
- **Negative**: Need explicit cross-system cache invalidation (solved via Redis pub/sub and Next.js on-demand ISR revalidation).
