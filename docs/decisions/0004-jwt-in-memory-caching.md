# ADR 0004: JWT Sessions with In-Memory Auth Caching for Low-Latency RBAC

## Status
Accepted

## Context
Every administrative request requires strict authentication and authorization checks against a database containing 6 roles and 115 fine-grained permissions. Executing 3 to 4 PostgreSQL queries (`admin_users`, `admin_roles`, `admin_role_permissions`, and permission lookup) on every single API request introduces significant database query overhead and latency (~100–300ms per request, compounding under dashboard multi-fetching).

## Decision
We implement a **Dual-Layer Auth Verification**:
1. **Cryptographic Validation**: Verify signed JWT access tokens containing user ID, email, role name, and session ID.
2. **In-Memory Permission Cache**:
   - Cache user profile, role status, and full permissions array in Node.js process memory using an LRU cache with a 30-second TTL.
   - On cache hit, auth & permission checks complete in **< 0.1ms** without touching PostgreSQL.
   - On cache miss, fetch from PostgreSQL and repopulate the cache.
3. **Session Revocation**:
   - Critical events (password changes, staff termination, role permission edits) immediately invalidate the cached user key and record the revocation in `admin_sessions`.

## Alternatives Considered
- **Stateless JWT with All 115 Permissions Packed into Payload**: Rejected because 115 permissions create an oversized JWT header (~4–6 KB) sent on every request, degrading network efficiency and cookie storage limits.
- **Querying Database on Every Request (No Cache)**: Rejected because it created unacceptable latency and database connection contention.

## Consequences
- **Positive**:
  - API response times dropped from ~250ms to ~15ms for cached authenticated requests.
  - Zero database load for repeated UI polling or tab switching.
- **Negative / Constraints**:
  - A maximum 30-second window exists before role permission changes propagate if an explicit invalidation signal is missed. Acceptable for an administrative control center.
