# 2. Modular Monolith Backend Architecture

Date: 2026-10-01
Status: Accepted

## Context
Admin operations require rich, transaction-heavy business logic (prescription inspection, batch inventory inwarding, FEFO stock allocation, refund approval, and audit trails). We needed an architecture that is easy to debug, maintain, and test for a lean engineering team.

## Decision
We structure `apps/admin-api` as a **Modular Monolith**:
- Each domain lives in `src/modules/<domain>/` with strict separation of concerns:
  - `<domain>.controller.ts`: Thin HTTP request parsing, Zod schema validation, response formatting.
  - `<domain>.service.ts`: Pure business logic, database transactions, domain rules.
  - `<domain>.routes.ts`: Route declarations, middleware bindings (auth, RBAC, rate limiting).
- Shared infrastructure lives in `src/lib/` (Redis, Mailer, Revalidation, Audit).
- No business logic inside controllers or route files.

## Alternatives Considered
- **Next.js Server Actions / API Routes**: Rejected for backend API because Express provides finer-grained middleware chains, long-running SSE streams, WebSocket/Worker flexibility, and robust rate-limiting.
- **NestJS**: Rejected due to heavy decorators and excessive boilerplate.

## Consequences
- **Positive**: Clear modular boundaries, easy unit testing of services, straightforward debugging at 2 a.m.
