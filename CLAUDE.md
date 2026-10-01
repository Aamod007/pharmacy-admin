# Project: Pharmico Standalone Admin Control Center (`pharmacy-admin`)

## What this product does
An enterprise-grade, standalone administration control center for a medical e-commerce and retail pharmacy platform. It manages prescription verification, FEFO batch inventory, doctor teleconsultations, catalog management, order fulfillment, and compliance audit logging, completely decoupled from the customer storefront.

## Stack (do not change without asking)
- **Frontend**: Next.js 15 (App Router) + TypeScript + TailwindCSS + Radix UI + Lucide React + Zustand + TanStack Query/Table
- **Backend**: Node.js 20 + Express + TypeScript (Modular Monolith)
- **Database**: PostgreSQL via Prisma ORM (`packages/db`)
- **Cache & Pub/Sub**: Redis (ioredis) + BullMQ
- **Authentication**: JWT + Cookie Sessions + otplib 2FA + RBAC
- **Testing**: Vitest (Unit/Integration) + Playwright (E2E)

## Rules
- Never commit secrets. All secrets must go in environment variables documented in `.env.example`.
- Every new API endpoint needs: input validation (Zod), auth check, authorization check (`can()`), and tests.
- Every database change must go through a Prisma migration file. Never edit the DB by hand.
- Run lint, typecheck, and tests (`npm run typecheck && npm test`) before marking any task as done.
- Ask before adding any new external dependency.
- Business logic lives in `/services`, route handlers stay thin.
- Keep components clean and enforce the 4 UI states: Loading (skeleton), Empty, Error (with retry), and Success.
- Prefer small, reviewable changes with conventional commits.

## Commands
- **Dev**: `npm run dev` (runs both API and Web concurrently)
- **API Dev**: `npm run dev:api` (port 5001)
- **Web Dev**: `npm run dev:web` (port 3002)
- **Test**: `npm test`
- **Lint/Typecheck**: `npm run lint && npm run typecheck`
- **Migrate**: `npm run db:migrate`
- **Seed**: `npm run db:seed`

## Architecture Decisions
See `/docs/decisions/` for the log of architectural decisions (ADRs) and why they were made.
