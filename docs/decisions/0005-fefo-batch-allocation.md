# ADR 0005: First-Expiry-First-Out (FEFO) Batch Allocation for Pharmacy Inventory

## Status
Accepted

## Context
Unlike general retail e-commerce, pharmaceutical products have strict expiration dates and regulatory batch tracking requirements (Drugs and Cosmetics Act, Good Distribution Practices). Selling an expired medication or failing to track which customer received which manufacturer batch number is a severe legal and health violation.

Standard inventory allocation systems often use FIFO (First-In, First-Out) or simple aggregate stock counters. We needed a reliable allocation mechanism that satisfies clinical safety standards and handles edge cases like near-expiry quarantine and batch recalls.

## Decision
We mandate **First-Expiry-First-Out (FEFO) Batch Allocation**:
1. Every inventory item is tracked through discrete `Batch` records containing:
   - `batchNumber`: Manufacturer-assigned lot number.
   - `expiryDate`: Product expiration date.
   - `quantity`: Current available stock in the batch.
   - `isBlocked`: Administrative quarantine flag (for damaged, inspected, or recalled lots).
2. During order allocation:
   - Batches with `isBlocked: true` or `expiryDate <= NOW()` are strictly excluded.
   - Available batches are sorted in ascending order of `expiryDate` (earliest expiring first).
   - Stock is deducted sequentially across batches until the ordered quantity is fulfilled.
   - If total non-expired, unblocked stock is insufficient, the transaction throws an `INSUFFICIENT_STOCK` error and rolls back.
3. Every deduction or addition creates an immutable `AdminStockMovement` audit record.

## Alternatives Considered
- **FIFO (First-In-First-Out)**: Rejected because a batch received earlier might actually have a later expiration date than a batch received later from a distributor. FEFO is the only legally defensible standard for pharmaceuticals.
- **Aggregate Quantity Only**: Rejected because lack of batch granularity makes targeted batch recalls impossible.

## Consequences
- **Positive**:
  - Eliminates the risk of dispensing expired medications to patients.
  - Enables instant batch-level quarantines and recall tracing.
  - Fully auditable stock history for drug inspectors and regulators.
- **Negative / Constraints**:
  - Requires atomic PostgreSQL transactions with row-level locks (`SELECT ... FOR UPDATE`) during order fulfillment to prevent race conditions during concurrent checkouts.
