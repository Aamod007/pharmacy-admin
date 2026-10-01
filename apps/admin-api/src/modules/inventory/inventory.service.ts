import prisma from "@pharmacy-admin/db";
import { StockAdjustmentInput, BatchCreateInput } from "@pharmacy-admin/shared";

export class InventoryService {
  async getBatches(query: {
    page?: number;
    limit?: number;
    variantId?: string;
    expiryDays?: string;
    stockStatus?: string;
    isBlocked?: boolean;
    search?: string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.variantId) where.variantId = query.variantId;
    if (query.isBlocked !== undefined) where.isBlocked = query.isBlocked;

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { batchNumber: { contains: term, mode: "insensitive" } },
        { variant: { name: { contains: term, mode: "insensitive" } } },
        { variant: { sku: { contains: term, mode: "insensitive" } } },
        { variant: { product: { name: { contains: term, mode: "insensitive" } } } },
        { variant: { product: { brand: { contains: term, mode: "insensitive" } } } },
      ];
    }

    const now = new Date();

    if (query.expiryDays && query.expiryDays !== "all") {
      if (query.expiryDays === "expired") {
        where.expiryDate = { lt: now };
      } else {
        const days = Number(query.expiryDays);
        if (!isNaN(days)) {
          const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
          where.expiryDate = { lte: targetDate, gte: now };
        }
      }
    }

    if (query.stockStatus && query.stockStatus !== "all") {
      if (query.stockStatus === "low") {
        where.quantity = { gt: 0, lte: 10 };
      } else if (query.stockStatus === "out") {
        where.quantity = { lte: 0 };
      } else if (query.stockStatus === "in_stock") {
        where.quantity = { gt: 10 };
      }
    }

    const [batches, total, stats] = await Promise.all([
      prisma.inventoryBatch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expiryDate: "asc" }, // Strict FEFO ordering
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true, slug: true, brand: true } },
            },
          },
        },
      }),
      prisma.inventoryBatch.count({ where }),
      prisma.inventoryBatch.aggregate({
        _count: { id: true },
        _sum: { quantity: true },
      }),
    ]);

    // Quick counts for summary pills
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const [expiring30Count, expiredCount, lowStockCount] = await Promise.all([
      prisma.inventoryBatch.count({
        where: { expiryDate: { lte: in30Days, gte: now } },
      }),
      prisma.inventoryBatch.count({
        where: { expiryDate: { lt: now } },
      }),
      prisma.inventoryBatch.count({
        where: { quantity: { gt: 0, lte: 10 } },
      }),
    ]);

    return {
      data: batches,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalBatches: stats._count.id || 0,
        totalUnits: stats._sum.quantity || 0,
        expiring30Count,
        expiredCount,
        lowStockCount,
      },
    };
  }

  async adjustStock(input: StockAdjustmentInput, adminUserId: string) {
    return prisma.$transaction(async (tx) => {
      const batch = await tx.inventoryBatch.findUnique({
        where: { id: input.batchId },
      });
      if (!batch) throw new Error("Batch not found");

      const previousStock = batch.quantity;
      const newStock = previousStock + input.quantity;

      if (newStock < 0) {
        throw new Error(`Insufficient stock in batch ${batch.batchNumber}. Available: ${previousStock}`);
      }

      await tx.inventoryBatch.update({
        where: { id: batch.id },
        data: { quantity: newStock },
      });

      const movement = await tx.adminStockMovement.create({
        data: {
          variantId: input.variantId,
          batchId: batch.id,
          type: input.type,
          quantity: Math.abs(input.quantity),
          previousStock,
          newStock,
          referenceType: "MANUAL_ADJUSTMENT",
          reason: input.reason,
          createdByAdminId: adminUserId,
        },
      });

      return { batchId: batch.id, previousStock, newStock, movementId: movement.id };
    });
  }

  async toggleBlockBatch(batchId: string, isBlocked: boolean, adminUserId: string) {
    const batch = await prisma.inventoryBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error("Batch not found");

    const updated = await prisma.inventoryBatch.update({
      where: { id: batchId },
      data: { isBlocked },
    });

    await prisma.adminStockMovement.create({
      data: {
        variantId: batch.variantId,
        batchId: batch.id,
        type: "CORRECTION",
        quantity: 0,
        previousStock: batch.quantity,
        newStock: batch.quantity,
        referenceType: "QUARANTINE_TOGGLE",
        reason: isBlocked ? "Batch Quarantined / Blocked from Sale" : "Batch Unblocked for Sale",
        createdByAdminId: adminUserId,
      },
    });

    return updated;
  }

  async getStockLedger(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [movements, total] = await Promise.all([
      prisma.adminStockMovement.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          variant: { include: { product: true } },
          batch: true,
          createdBy: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.adminStockMovement.count(),
    ]);

    return { data: movements, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

export const inventoryService = new InventoryService();
