import { describe, it, expect } from "vitest";

interface Batch {
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
}

function allocateFefoBatches(batches: Batch[], orderQty: number) {
  // Sort strictly ascending by expiry date (FEFO)
  const sorted = [...batches].sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
  let remaining = orderQty;
  const allocations: { batchNumber: string; allocatedQty: number }[] = [];

  for (const b of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(b.quantity, remaining);
    if (take > 0) {
      allocations.push({ batchNumber: b.batchNumber, allocatedQty: take });
      remaining -= take;
    }
  }

  if (remaining > 0) {
    throw new Error("Insufficient unexpired stock across batches");
  }

  return allocations;
}

describe("FEFO (First-Expired, First-Out) Inventory Allocation", () => {
  it("allocates stock from the earliest expiring batch first", () => {
    const batches: Batch[] = [
      { batchNumber: "B2", expiryDate: new Date("2027-12-31"), quantity: 50 },
      { batchNumber: "B1", expiryDate: new Date("2026-06-30"), quantity: 15 },
      { batchNumber: "B3", expiryDate: new Date("2028-05-15"), quantity: 100 },
    ];

    const result = allocateFefoBatches(batches, 20);
    expect(result).toEqual([
      { batchNumber: "B1", allocatedQty: 15 },
      { batchNumber: "B2", allocatedQty: 5 },
    ]);
  });
});
