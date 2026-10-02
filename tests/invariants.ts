import { PrismaClient } from "@prisma/client";

export async function assertStockInvariants(prisma: PrismaClient) {
  // Invariant I1: batch quantity never negative
  const negativeBatches = await prisma.$queryRaw<any[]>`
    SELECT id, "batchNumber", quantity 
    FROM "InventoryBatch" 
    WHERE quantity < 0
  `;
  if (negativeBatches.length > 0) {
    throw new Error(
      `INVARIANT VIOLATION I1: Batch quantity is negative for batches: ${JSON.stringify(negativeBatches)}`
    );
  }

  // Invariant I4: no sale/allocation ever comes from an expired batch
  const expiredSales = await prisma.$queryRaw<any[]>`
    SELECT asm.id, asm."batchId", ib."batchNumber", ib."expiryDate", asm."createdAt"
    FROM "admin_stock_movements" asm
    JOIN "InventoryBatch" ib ON asm."batchId" = ib.id
    WHERE asm.type = 'SALE' AND ib."expiryDate" < asm."createdAt"
  `;
  if (expiredSales.length > 0) {
    throw new Error(
      `INVARIANT VIOLATION I4: Sale allocated from expired batch: ${JSON.stringify(expiredSales)}`
    );
  }

  // Invariant I5: every stock change has a ledger row with reason and timestamp
  const missingReasonMovements = await prisma.$queryRaw<any[]>`
    SELECT id, type, "variantId", "batchId"
    FROM "admin_stock_movements"
    WHERE reason IS NULL OR reason = '' OR "createdAt" IS NULL
  `;
  if (missingReasonMovements.length > 0) {
    throw new Error(
      `INVARIANT VIOLATION I5: Stock movement missing reason or timestamp: ${JSON.stringify(missingReasonMovements)}`
    );
  }

  // Invariant I2: for each batch with movements, the latest movement newStock equals current batch quantity
  const mismatchedBatches = await prisma.$queryRaw<any[]>`
    WITH LatestMovements AS (
      SELECT DISTINCT ON ("batchId") "batchId", "newStock", "createdAt"
      FROM "admin_stock_movements"
      WHERE "batchId" IS NOT NULL
      ORDER BY "batchId", "createdAt" DESC, id DESC
    )
    SELECT ib.id, ib."batchNumber", ib.quantity as "currentQty", lm."newStock" as "ledgerQty"
    FROM "InventoryBatch" ib
    JOIN LatestMovements lm ON ib.id = lm."batchId"
    WHERE ib.quantity != lm."newStock"
  `;
  if (mismatchedBatches.length > 0) {
    throw new Error(
      `INVARIANT VIOLATION I2: Batch quantity does not match latest ledger movement: ${JSON.stringify(mismatchedBatches)}`
    );
  }

  // Invariant I3: Product variant total stock equals sum of its non-expired batch quantities
  const variantStockCheck = await prisma.$queryRaw<any[]>`
    SELECT pv.id, pv.sku,
           COALESCE(SUM(CASE WHEN ib."expiryDate" > NOW() AND ib."isBlocked" = false THEN ib.quantity ELSE 0 END), 0) as "unexpiredStock"
    FROM "ProductVariant" pv
    LEFT JOIN "InventoryBatch" ib ON pv.id = ib."variantId"
    GROUP BY pv.id, pv.sku
    HAVING COALESCE(SUM(CASE WHEN ib."expiryDate" > NOW() AND ib."isBlocked" = false THEN ib.quantity ELSE 0 END), 0) < 0
  `;
  if (variantStockCheck.length > 0) {
    throw new Error(
      `INVARIANT VIOLATION I3: Variant unexpired stock calculation error: ${JSON.stringify(variantStockCheck)}`
    );
  }

  // Invariant I6: Cancelled orders with SALE movements must have equal RETURN_RESTOCK movements
  const unrestoredCancelledOrders = await prisma.$queryRaw<any[]>`
    SELECT o.id, o."orderNumber",
           SUM(CASE WHEN asm.type = 'SALE' THEN asm.quantity ELSE 0 END) as "soldQty",
           SUM(CASE WHEN asm.type = 'RETURN_RESTOCK' THEN asm.quantity ELSE 0 END) as "restockedQty"
    FROM "Order" o
    JOIN "admin_stock_movements" asm ON o.id = asm."referenceId"
    WHERE o.status = 'CANCELLED'
    GROUP BY o.id, o."orderNumber"
    HAVING SUM(CASE WHEN asm.type = 'SALE' THEN asm.quantity ELSE 0 END) != SUM(CASE WHEN asm.type = 'RETURN_RESTOCK' THEN asm.quantity ELSE 0 END)
  `;
  if (unrestoredCancelledOrders.length > 0) {
    throw new Error(
      `INVARIANT VIOLATION I6: Cancelled order has unrestored stock: ${JSON.stringify(unrestoredCancelledOrders)}`
    );
  }

  return { success: true };
}
