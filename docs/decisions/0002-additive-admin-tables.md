# ADR 0002: Additive Admin Table Partitioning (`admin_` prefix)

## Status
Accepted

## Context
The admin control center operates alongside an existing medical e-commerce storefront (`medico_db`). Both applications read from shared tables (e.g., `Product`, `Order`, `Prescription`, `User`). We needed an architectural strategy to introduce admin-only functionality (staff accounts, RBAC permissions, audit trails, stock adjustment ledgers, batch quarantines) without risking schema regressions or breaking migrations on the live storefront.

## Decision
We enforce **Additive Admin Table Partitioning**:
1. All new models, relations, and enums owned solely by the administrative control center are prefixed with `admin_` (e.g., `admin_users`, `admin_roles`, `admin_role_permissions`, `admin_sessions`, `admin_audit_logs`, `admin_stock_movements`, `admin_batch_adjustments`).
2. Existing storefront tables are treated as shared resources with additive foreign keys. No existing columns on storefront tables are dropped or renamed by admin migrations.
3. Every database migration in `packages/db/prisma/migrations` must be strictly backward-compatible.

## Alternatives Considered
- **Separate Admin Database**: Creating a completely detached database for the admin panel and syncing storefront data via ETL / Change Data Capture (CDC). Rejected due to operational complexity, eventual consistency lag (dangerous for inventory reservations and prescription approvals), and higher database hosting cost.
- **Modifying Core Storefront Tables Directly**: Adding admin flags directly into customer `User` and `Order` tables without isolation. Rejected because it blurs security boundaries (e.g., mixing customer passwords with administrative staff passwords) and risks breaking storefront queries.

## Consequences
- **Positive**:
  - Total isolation of sensitive admin credentials (`admin_users` has separate password hashes, 2FA secrets, and brute-force lockouts from customer storefront users).
  - Zero risk of admin migrations impacting storefront table schemas.
  - Transparent audit trail: storefront actions and admin actions are clearly distinguished in `admin_audit_logs`.
- **Negative / Constraints**:
  - Developers must remember to use the `admin_` prefix for any new administrative entities.
