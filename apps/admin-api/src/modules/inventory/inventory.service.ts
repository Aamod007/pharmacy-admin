import prisma from "@pharmacy-admin/db";
import {
  StockAdjustmentInput,
  BatchCreateInput,
  BatchUpdateInput,
  PurchaseEntryCreateInput,
} from "@pharmacy-admin/shared";
import { syncMutationToMainSite } from "../../lib/revalidate";
import { resolveAdminUserId } from "../../lib/admin-user";

const TX_OPTIONS = { maxWait: 15000, timeout: 60000 };

export class InventoryService {
  /**
   * List batches with FEFO ordering, search, filtering, and summary metrics
   */
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
        { variant: { product: { brand: { name: { contains: term, mode: "insensitive" } } } } },
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

    // IST 30/60/90 days boundary calculations
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const [expiring30Count, expiring60Count, expiring90Count, expiredCount, lowStockCount] =
      await Promise.all([
        prisma.inventoryBatch.count({ where: { expiryDate: { lte: in30Days, gte: now } } }),
        prisma.inventoryBatch.count({ where: { expiryDate: { lte: in60Days, gte: now } } }),
        prisma.inventoryBatch.count({ where: { expiryDate: { lte: in90Days, gte: now } } }),
        prisma.inventoryBatch.count({ where: { expiryDate: { lt: now } } }),
        prisma.inventoryBatch.count({ where: { quantity: { gt: 0, lte: 10 } } }),
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
        expiring60Count,
        expiring90Count,
        expiredCount,
        lowStockCount,
      },
    };
  }

  /**
   * S2: Add a new batch to an existing product variant with statutory pharmaceutical validations
   */
  async createBatch(input: BatchCreateInput, actor: { adminId: string; email: string }) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: input.variantId },
      include: { product: true },
    });
    if (!variant) throw new Error("Product variant not found");

    const mfg = new Date(input.mfgDate);
    const expiry = new Date(input.expiryDate);
    const now = new Date();

    if (expiry <= mfg) {
      throw new Error("Batch expiry date must be strictly after manufacturing date");
    }

    if (expiry <= now) {
      throw new Error("Cannot receive already expired batch into active inventory");
    }

    // Check duplicate batch number on this variant
    const existing = await prisma.inventoryBatch.findFirst({
      where: { variantId: input.variantId, batchNumber: input.batchNumber },
    });
    if (existing) {
      throw new Error(`Batch number '${input.batchNumber}' already exists for this medicine variant`);
    }

    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.inventoryBatch.create({
        data: {
          variantId: input.variantId,
          batchNumber: input.batchNumber,
          mfgDate: mfg,
          expiryDate: expiry,
          quantity: input.quantity,
          costPrice: input.costPrice,
          isBlocked: input.isBlocked || false,
        },
      });

      const validAdminId = await resolveAdminUserId(actor?.adminId, actor?.email, tx);
      const movement = await tx.adminStockMovement.create({
        data: {
          variantId: input.variantId,
          batchId: batch.id,
          type: "PURCHASE",
          quantity: input.quantity,
          previousStock: 0,
          newStock: input.quantity,
          referenceType: "BATCH_CREATION",
          reason: "Initial batch intake into inventory",
          createdByAdminId: validAdminId,
        },
      });

      return { batch, movement };
    }, TX_OPTIONS);

    if (variant.product) {
      syncMutationToMainSite({
        type: "inventory.updated",
        entityId: variant.product.id,
        entityName: `${variant.product.name} (Batch ${input.batchNumber} added: ${input.quantity} units)`,
        tags: ["products", "inventory", `product:${variant.product.slug}`],
        paths: ["/", "/products", `/products/${variant.product.slug}`],
        actor,
      });
    }

    return result.batch;
  }

  /**
   * S2: Edit batch details with mandatory reason
   */
  async updateBatch(batchId: string, input: BatchUpdateInput, actor: { adminId: string; email: string }) {
    const batch = await prisma.inventoryBatch.findUnique({
      where: { id: batchId },
      include: { variant: { include: { product: true } } },
    });
    if (!batch) throw new Error("Batch not found");

    if (input.batchNumber && input.batchNumber !== batch.batchNumber) {
      const duplicate = await prisma.inventoryBatch.findFirst({
        where: { variantId: batch.variantId, batchNumber: input.batchNumber, id: { not: batchId } },
      });
      if (duplicate) {
        throw new Error(`Batch number '${input.batchNumber}' already exists for this variant`);
      }
    }

    const updateData: any = {};
    if (input.batchNumber) updateData.batchNumber = input.batchNumber;
    if (input.expiryDate) updateData.expiryDate = new Date(input.expiryDate);
    if (input.costPrice !== undefined) updateData.costPrice = input.costPrice;
    if (input.isBlocked !== undefined) updateData.isBlocked = input.isBlocked;

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.inventoryBatch.update({
        where: { id: batchId },
        data: updateData,
      });

      const validAdminId = await resolveAdminUserId(actor?.adminId, actor?.email, tx);
      await tx.adminStockMovement.create({
        data: {
          variantId: batch.variantId,
          batchId: batch.id,
          type: "CORRECTION",
          quantity: 0,
          previousStock: batch.quantity,
          newStock: batch.quantity,
          referenceType: "BATCH_EDIT",
          reason: input.reason || "Administrative batch metadata update",
          createdByAdminId: validAdminId,
        },
      });

      return b;
    }, TX_OPTIONS);

    if (batch.variant?.product) {
      syncMutationToMainSite({
        type: "inventory.updated",
        entityId: batch.variant.product.id,
        entityName: `${batch.variant.product.name} (Batch ${updated.batchNumber} updated)`,
        tags: ["products", "inventory", `product:${batch.variant.product.slug}`],
        paths: ["/", "/products", `/products/${batch.variant.product.slug}`],
        actor,
      });
    }

    return updated;
  }

  /**
   * S2: Delete batch with sales history safety guard
   */
  async deleteBatch(batchId: string, actor: { adminId: string; email: string }) {
    const batch = await prisma.inventoryBatch.findUnique({
      where: { id: batchId },
      include: { variant: { include: { product: true } } },
    });
    if (!batch) throw new Error("Batch not found");

    // Guard: Check if batch has any sales history
    const salesMovements = await prisma.adminStockMovement.count({
      where: { batchId, type: "SALE" },
    });
    if (salesMovements > 0) {
      throw new Error(
        `Cannot delete batch #${batch.batchNumber} because it has statutory sales history (${salesMovements} dispensations recorded). Quarantine the batch instead.`
      );
    }

    await prisma.$transaction(async (tx) => {
      // Clean up internal non-sale movements
      await tx.adminStockMovement.deleteMany({
        where: { batchId },
      });

      await tx.inventoryBatch.delete({
        where: { id: batchId },
      });
    }, TX_OPTIONS);

    if (batch.variant?.product) {
      syncMutationToMainSite({
        type: "inventory.updated",
        entityId: batch.variant.product.id,
        entityName: `${batch.variant.product.name} (Batch ${batch.batchNumber} removed)`,
        tags: ["products", "inventory", `product:${batch.variant.product.slug}`],
        paths: ["/", "/products", `/products/${batch.variant.product.slug}`],
        actor,
      });
    }

    return { success: true, message: `Batch #${batch.batchNumber} successfully removed` };
  }

  /**
   * S4: Purchase Entry (Supplier + Invoice No. increases batch stock & computes total value)
   */
  async createPurchaseEntry(input: PurchaseEntryCreateInput, actor: { adminId: string; email: string }) {
    const supplier = await prisma.adminSupplier.findUnique({
      where: { id: input.supplierId },
    });
    if (!supplier) throw new Error("Supplier not found");

    // Check duplicate supplier invoice
    const duplicateInvoice = await prisma.adminPurchaseEntry.findFirst({
      where: { supplierId: input.supplierId, invoiceNumber: input.invoiceNumber },
    });
    if (duplicateInvoice) {
      throw new Error(`Supplier invoice '${input.invoiceNumber}' has already been processed for ${supplier.name}`);
    }

    const result = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let totalTax = 0;

      for (const item of input.items) {
        const itemTotal = item.quantity * item.costPrice;
        subtotal += itemTotal;
        totalTax += itemTotal * 0.12; // Standard 12% pharmaceutical GST
      }
      const totalAmount = subtotal + totalTax;

      const validAdminId = await resolveAdminUserId(actor?.adminId, actor?.email, tx);
      const requiredAdminId = validAdminId || (await resolveAdminUserId(null, null, tx)) || "";

      const purchaseEntry = await tx.adminPurchaseEntry.create({
        data: {
          supplierId: input.supplierId,
          invoiceNumber: input.invoiceNumber,
          invoiceDate: new Date(input.invoiceDate),
          subtotal,
          taxAmount: totalTax,
          totalAmount,
          status: "RECEIVED",
          notes: input.notes,
          createdByAdminId: requiredAdminId,
        },
      });

      const affectedProducts = new Set<string>();

      for (const item of input.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });
        if (!variant) throw new Error(`Product variant ${item.variantId} not found`);

        if (variant.product) affectedProducts.add(variant.product.id);

        const mfg = new Date(item.mfgDate);
        const expiry = new Date(item.expiryDate);
        if (expiry <= mfg) {
          throw new Error(`Batch ${item.batchNumber}: Expiry date must be later than manufacturing date`);
        }

        // Find or create batch
        let batch = await tx.inventoryBatch.findFirst({
          where: { variantId: item.variantId, batchNumber: item.batchNumber },
        });

        let previousStock = 0;
        let newStock = item.quantity;

        if (batch) {
          previousStock = batch.quantity;
          newStock = previousStock + item.quantity;
          batch = await tx.inventoryBatch.update({
            where: { id: batch.id },
            data: {
              quantity: newStock,
              costPrice: item.costPrice,
              expiryDate: expiry,
              mfgDate: mfg,
            },
          });
        } else {
          batch = await tx.inventoryBatch.create({
            data: {
              variantId: item.variantId,
              batchNumber: item.batchNumber,
              mfgDate: mfg,
              expiryDate: expiry,
              quantity: item.quantity,
              costPrice: item.costPrice,
            },
          });
        }

        // Create Purchase Item row
        await tx.adminPurchaseItem.create({
          data: {
            purchaseEntryId: purchaseEntry.id,
            variantId: item.variantId,
            batchNumber: item.batchNumber,
            mfgDate: mfg,
            expiryDate: expiry,
            quantity: item.quantity,
            purchaseRate: item.costPrice,
            mrp: Number(variant.mrp || variant.price),
            gstRate: 12.0,
            taxAmount: item.quantity * item.costPrice * 0.12,
            totalAmount: item.quantity * item.costPrice * 1.12,
          },
        });

        // Write Stock Ledger
        await tx.adminStockMovement.create({
          data: {
            variantId: item.variantId,
            batchId: batch.id,
            type: "PURCHASE",
            quantity: item.quantity,
            previousStock,
            newStock,
            referenceId: purchaseEntry.id,
            referenceType: "PURCHASE_ENTRY",
            reason: `Supplier Invoice #${input.invoiceNumber} from ${supplier.name}`,
            createdByAdminId: validAdminId,
          },
        });
      }

      return { purchaseEntry, affectedProducts: Array.from(affectedProducts) };
    }, TX_OPTIONS);

    for (const prodId of result.affectedProducts) {
      syncMutationToMainSite({
        type: "inventory.updated",
        entityId: prodId,
        entityName: `Stock received via Invoice #${input.invoiceNumber}`,
        tags: ["products", "inventory"],
        paths: ["/", "/products"],
        actor,
      });
    }

    return result.purchaseEntry;
  }

  /**
   * S5: Stock Adjustment (damage, found stock, return to supplier, correction)
   */
  async adjustStock(input: StockAdjustmentInput, actor: { adminId: string; email: string }) {
    if (!input.reason || input.reason.trim().length < 3) {
      throw new Error("A specific statutory reason is required for stock adjustments");
    }

    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.inventoryBatch.findUnique({
        where: { id: input.batchId },
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      });
      if (!batch) throw new Error("Batch not found");

      const previousStock = batch.quantity;
      const newStock = previousStock + input.quantity;

      if (newStock < 0) {
        throw new Error(
          `Adjustment would result in negative stock in batch ${batch.batchNumber}. Available: ${previousStock}`
        );
      }

      await tx.inventoryBatch.update({
        where: { id: batch.id },
        data: { quantity: newStock },
      });

      const validAdminId = await resolveAdminUserId(actor?.adminId, actor?.email, tx);
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
          createdByAdminId: validAdminId,
        },
      });

      return {
        batchId: batch.id,
        previousStock,
        newStock,
        movementId: movement.id,
        product: batch.variant?.product,
        batchNumber: batch.batchNumber,
      };
    }, TX_OPTIONS);

    if (result.product) {
      syncMutationToMainSite({
        type: "inventory.updated",
        entityId: result.product.id,
        entityName: `${result.product.name} (Batch ${result.batchNumber}: ${result.newStock} units)`,
        tags: ["products", "inventory", `product:${result.product.slug}`],
        paths: ["/", "/products", `/products/${result.product.slug}`],
        actor,
      });
    }

    return result;
  }

  /**
   * S6: Quarantine or write-off expired stock
   */
  async writeOffBatch(batchId: string, reason: string, actor: { adminId: string; email: string }) {
    const batch = await prisma.inventoryBatch.findUnique({
      where: { id: batchId },
      include: { variant: { include: { product: true } } },
    });
    if (!batch) throw new Error("Batch not found");

    const previousStock = batch.quantity;
    if (previousStock === 0) {
      throw new Error(`Batch #${batch.batchNumber} has 0 quantity; nothing to write off`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.inventoryBatch.update({
        where: { id: batchId },
        data: { quantity: 0, isBlocked: true },
      });

      const validAdminId = await resolveAdminUserId(actor?.adminId, actor?.email, tx);
      await tx.adminStockMovement.create({
        data: {
          variantId: batch.variantId,
          batchId: batch.id,
          type: "EXPIRED",
          quantity: previousStock,
          previousStock,
          newStock: 0,
          referenceType: "EXPIRY_WRITEOFF",
          reason: reason || "Statutory write-off of expired pharmaceuticals",
          createdByAdminId: validAdminId,
        },
      });

      return b;
    }, TX_OPTIONS);

    if (batch.variant?.product) {
      syncMutationToMainSite({
        type: "inventory.updated",
        entityId: batch.variant.product.id,
        entityName: `${batch.variant.product.name} (Batch ${batch.batchNumber} written off: 0 units)`,
        tags: ["products", "inventory", `product:${batch.variant.product.slug}`],
        paths: ["/", "/products", `/products/${batch.variant.product.slug}`],
        actor,
      });
    }

    return updated;
  }

  /**
   * S3 & S8: FEFO Order Allocation (strictly consumes earliest unexpired batches)
   */
  async allocateFefoOrder(
    orderId: string,
    actor: { adminId: string; email: string },
    client?: any
  ) {
    const run = async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                  batches: {
                    where: { isBlocked: false, expiryDate: { gt: new Date() } },
                    orderBy: { expiryDate: "asc" }, // Strict FEFO
                  },
                },
              },
            },
          },
        },
      });
      if (!order) throw new Error("Order not found");

      const validAdminId = await resolveAdminUserId(actor?.adminId, actor?.email, tx);
      const allocations: any[] = [];
      const affectedProducts = new Set<string>();

      for (const item of order.items) {
        let remainingToAllocate = item.quantity;
        const availableBatches = item.variant.batches;

        for (const candidateBatch of availableBatches) {
          if (remainingToAllocate <= 0) break;

          // Pessimistic row locking: Lock the batch row exclusively to ensure fresh stock reads and serialized atomic allocations
          const lockedBatches = await tx.$queryRaw<any[]>`
            SELECT id, "batchNumber", quantity, "expiryDate", "isBlocked"
            FROM "InventoryBatch"
            WHERE id = ${candidateBatch.id}
            FOR UPDATE
          `;

          const lockedBatch = lockedBatches[0];
          if (!lockedBatch || lockedBatch.isBlocked || lockedBatch.quantity <= 0) {
            continue;
          }

          const currentStock = lockedBatch.quantity;
          const take = Math.min(currentStock, remainingToAllocate);
          if (take <= 0) continue;

          const previousStock = currentStock;
          const newStock = previousStock - take;

          await tx.inventoryBatch.update({
            where: { id: lockedBatch.id },
            data: { quantity: newStock },
          });

          await tx.adminStockMovement.create({
            data: {
              variantId: item.variantId,
              batchId: lockedBatch.id,
              type: "SALE",
              quantity: take,
              previousStock,
              newStock,
              referenceId: order.id,
              referenceType: "ORDER",
              reason: `Order #${order.orderNumber} dispensation`,
              createdByAdminId: validAdminId,
            },
          });

          if (item.variant?.product) {
            affectedProducts.add(item.variant.product.id);
          }

          allocations.push({
            orderItemId: item.id,
            batchId: lockedBatch.id,
            batchNumber: lockedBatch.batchNumber,
            allocatedQty: take,
            expiryDate: lockedBatch.expiryDate,
          });

          remainingToAllocate -= take;
        }

        if (remainingToAllocate > 0) {
          throw new Error(
            `Insufficient unexpired stock across batches for '${item.variant.name}'. Needed: ${item.quantity}`
          );
        }
      }

      return { allocations, affectedProducts: Array.from(affectedProducts) };
    };

    const result = client ? await run(client) : await prisma.$transaction(run, TX_OPTIONS);

    for (const prodId of result.affectedProducts) {
      syncMutationToMainSite({
        type: "inventory.updated",
        entityId: prodId,
        entityName: `Stock reduced for Order #${orderId}`,
        tags: ["products", "inventory"],
        paths: ["/", "/products"],
        actor,
      });
    }

    return result.allocations;
  }

  /**
   * S10: Export batches with formula-injection neutralization
   */
  async exportBatchesCsv() {
    const batches = await prisma.inventoryBatch.findMany({
      orderBy: { expiryDate: "asc" },
      include: {
        variant: {
          include: {
            product: { select: { name: true, brand: { select: { name: true } } } },
          },
        },
      },
    });

    const sanitizeCell = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      // Neutralize formula injection (=, +, -, @, \t, \r)
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = [
      "Batch Number",
      "Medicine Name",
      "Brand",
      "SKU",
      "Quantity",
      "Cost Price",
      "MRP",
      "Mfg Date",
      "Expiry Date",
      "Status",
    ];

    const rows = batches.map((b) => [
      sanitizeCell(b.batchNumber),
      sanitizeCell(b.variant?.product?.name || ""),
      sanitizeCell(b.variant?.product?.brand?.name || ""),
      sanitizeCell(b.variant?.sku || ""),
      sanitizeCell(b.quantity),
      sanitizeCell(b.costPrice),
      sanitizeCell(b.variant?.mrp || ""),
      sanitizeCell(b.mfgDate.toISOString().split("T")[0]),
      sanitizeCell(b.expiryDate.toISOString().split("T")[0]),
      sanitizeCell(b.isBlocked ? "Quarantined" : b.quantity <= 0 ? "Out of Stock" : "Active"),
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  }

  /**
   * S11: Stock Valuation and Dead Stock Analytics
   */
  async getValuationReport() {
    const batches = await prisma.inventoryBatch.findMany({
      where: { quantity: { gt: 0 } },
      include: {
        variant: {
          include: {
            product: { include: { category: true } },
          },
        },
      },
    });

    let totalPurchaseValuation = 0;
    let totalSellingValuation = 0;
    const categoryBreakdown: Record<string, { purchaseVal: number; sellingVal: number; units: number }> = {};

    const now = new Date();
    let expiredValuation = 0;

    for (const b of batches) {
      const qty = b.quantity;
      const cost = Number(b.costPrice);
      const price = Number(b.variant?.price || 0);

      const purchaseTotal = qty * cost;
      const sellingTotal = qty * price;

      totalPurchaseValuation += purchaseTotal;
      totalSellingValuation += sellingTotal;

      if (b.expiryDate < now) {
        expiredValuation += purchaseTotal;
      }

      const catName = b.variant?.product?.category?.name || "Uncategorized";
      if (!categoryBreakdown[catName]) {
        categoryBreakdown[catName] = { purchaseVal: 0, sellingVal: 0, units: 0 };
      }
      categoryBreakdown[catName].purchaseVal += purchaseTotal;
      categoryBreakdown[catName].sellingVal += sellingTotal;
      categoryBreakdown[catName].units += qty;
    }

    return {
      totalPurchaseValuation: Number(totalPurchaseValuation.toFixed(2)),
      totalSellingValuation: Number(totalSellingValuation.toFixed(2)),
      projectedMargin: Number((totalSellingValuation - totalPurchaseValuation).toFixed(2)),
      marginPercentage:
        totalSellingValuation > 0
          ? Number((((totalSellingValuation - totalPurchaseValuation) / totalSellingValuation) * 100).toFixed(1))
          : 0,
      expiredValuation: Number(expiredValuation.toFixed(2)),
      categoryBreakdown,
    };
  }

  /**
   * Toggle quarantine on/off
   */
  async toggleBlockBatch(batchId: string, isBlocked: boolean, actor: { adminId: string; email: string }) {
    const batch = await prisma.inventoryBatch.findUnique({
      where: { id: batchId },
      include: { variant: { include: { product: true } } },
    });
    if (!batch) throw new Error("Batch not found");

    const updated = await prisma.inventoryBatch.update({
      where: { id: batchId },
      data: { isBlocked },
    });

    const validAdminId = await resolveAdminUserId(actor?.adminId, actor?.email);
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
        createdByAdminId: validAdminId,
      },
    });

    if (batch.variant?.product) {
      syncMutationToMainSite({
        type: "inventory.updated",
        entityId: batch.variant.product.id,
        entityName: `${batch.variant.product.name} (Batch ${batch.batchNumber} ${isBlocked ? "Quarantined" : "Unblocked"})`,
        tags: ["products", "inventory", `product:${batch.variant.product.slug}`],
        paths: ["/", "/products", `/products/${batch.variant.product.slug}`],
        actor,
      });
    }

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
