import { Request, Response } from "express";
import { inventoryService } from "./inventory.service";
import {
  stockAdjustmentSchema,
  batchCreateSchema,
  batchUpdateSchema,
  batchWriteOffSchema,
  purchaseEntryCreateSchema,
} from "@pharmacy-admin/shared";

export class InventoryController {
  async getBatches(req: Request, res: Response) {
    const result = await inventoryService.getBatches({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      variantId: req.query.variantId as string,
      expiryDays: req.query.expiryDays as string,
      stockStatus: req.query.stockStatus as string,
      isBlocked: req.query.isBlocked === "true" ? true : req.query.isBlocked === "false" ? false : undefined,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as "asc" | "desc") || "asc",
    });
    return res.json({ success: true, ...result });
  }

  async createBatch(req: Request, res: Response) {
    const validated = batchCreateSchema.parse(req.body);
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const result = await inventoryService.createBatch(validated, actor);
    return res.status(201).json({ success: true, data: result, message: "Inventory batch added successfully" });
  }

  async updateBatch(req: Request, res: Response) {
    const validated = batchUpdateSchema.parse(req.body);
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const result = await inventoryService.updateBatch(req.params.id, validated, actor);
    return res.json({ success: true, data: result, message: "Batch updated successfully" });
  }

  async deleteBatch(req: Request, res: Response) {
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const result = await inventoryService.deleteBatch(req.params.id, actor);
    return res.json(result);
  }

  async createPurchaseEntry(req: Request, res: Response) {
    const validated = purchaseEntryCreateSchema.parse(req.body);
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const result = await inventoryService.createPurchaseEntry(validated, actor);
    return res.status(201).json({ success: true, data: result, message: "Supplier purchase entry received" });
  }

  async adjustStock(req: Request, res: Response) {
    const validated = stockAdjustmentSchema.parse(req.body);
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const result = await inventoryService.adjustStock(validated, actor);
    return res.json({ success: true, data: result, message: "Stock adjustment recorded" });
  }

  async writeOffBatch(req: Request, res: Response) {
    const validated = batchWriteOffSchema.parse(req.body);
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const result = await inventoryService.writeOffBatch(req.params.id, validated.reason, actor);
    return res.json({ success: true, data: result, message: "Batch written off and quarantined" });
  }

  async toggleBlock(req: Request, res: Response) {
    const batchId = req.params.id;
    const { isBlocked } = req.body;
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const result = await inventoryService.toggleBlockBatch(batchId, Boolean(isBlocked), actor);
    return res.json({
      success: true,
      data: result,
      message: isBlocked ? "Batch quarantined from sales" : "Batch unblocked for sales",
    });
  }

  async getLedger(req: Request, res: Response) {
    const result = await inventoryService.getStockLedger(
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20
    );
    return res.json({ success: true, ...result });
  }

  async exportCsv(_req: Request, res: Response) {
    const csv = await inventoryService.exportBatchesCsv();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=inventory_batches.csv");
    return res.send(csv);
  }

  async getValuation(_req: Request, res: Response) {
    const result = await inventoryService.getValuationReport();
    return res.json({ success: true, data: result });
  }
}

export const inventoryController = new InventoryController();
