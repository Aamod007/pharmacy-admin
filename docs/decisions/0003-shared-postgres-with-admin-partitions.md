# 3. Shared PostgreSQL Database with Admin Models

Date: 2026-10-01
Status: Accepted

## Context
The customer storefront and admin control center operate on the same core entities (Products, Inventory Batches, Orders, Prescriptions, Users). Duplicating data into a separate admin database would require complex CDC (Change Data Capture) pipelines like Debezium or Kafka.

## Decision
Both platforms share the same PostgreSQL database (`medico_db`), while administrative-specific data models are clearly partitioned with the `Admin*` prefix:
- **Core Shared Models**: `Product`, `ProductVariant`, `InventoryBatch`, `Order`, `OrderItem`, `Prescription`, `Payment`, `User`.
- **Admin Extension Models**: `AdminUser`, `AdminRole`, `AdminPermission`, `AdminAuditLog`, `AdminStockMovement`, `AdminSupplier`, `AdminPurchaseEntry`, `AdminSupportTicket`, `AdminEmailTemplate`, `AdminNotificationLog`.

## Alternatives Considered
- Separate Admin DB with dual writes: Rejected due to consistency issues on stock allocation and order statuses.

## Consequences
- **Positive**: Immediate ACID transactions on stock updates and prescription approvals without eventual consistency delays.
- **Negative**: Schema changes must be coordinated via migration files in version control.
