# ADR 0001: Modular Monolith Architecture for Backend API

## Status
Accepted

## Context
The Pharmico Admin Control Center requires managing 15 distinct functional modules: authentication, catalog/products, FEFO batch inventory, prescription inspection, order state machine, teleconsultations, lab test bookings, doctor management, customer CRM, coupons/promotions, banners, email marketing, staff RBAC, store settings, and immutable audit logs.

We considered two primary architectures:
1. **Microservices Architecture**: Separate services for Inventory, Orders, Prescriptions, Catalog, and Auth.
2. **Modular Monolith**: A single Express + TypeScript backend application organized into clean, isolated domain modules (`/modules/*`), with shared database access via Prisma and clear boundaries.

## Decision
We chose a **Modular Monolith** architecture for the backend API (`apps/admin-api`).

Each feature module resides in `apps/admin-api/src/modules/<module-name>/` with dedicated:
- `<module>.routes.ts`: HTTP route definitions with Zod schema validation
- `<module>.controller.ts`: Thin request/response handlers
- `<module>.service.ts`: Pure business logic and database transactions
- `<module>.schemas.ts`: Request/response Zod validation schemas

## Alternatives Considered
- **Microservices**: Rejected due to high operational complexity, distributed transaction overhead (especially for stock reservation during order processing), network latency between services, and increased infrastructure cost for an early/mid-stage SaaS.
- **NestJS Framework**: Rejected because of heavy decorator magic, slower cold-boot times, steep learning curve, and difficulty debugging at 2 a.m. compared to standard idiomatic Express + TypeScript.

## Consequences
- **Positive**:
  - Single deployable Docker image (`apps/admin-api/Dockerfile`).
  - Zero network overhead for inter-module operations (e.g., inventory batch reservation within order state transition).
  - Simple local developer setup (`npm run dev:api`).
  - ACID transactions across related models using Prisma transactions (`prisma.$transaction`).
- **Negative / Constraints**:
  - Requires discipline to prevent tight coupling across modules. Inter-module communication must happen via exported service methods rather than direct cross-table modifications.
