import { Request, Response } from "express";
import { inventoryService } from "./inventory.service";
import { stockAdjustmentSchema } from "@pharmacy-admin/shared";

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
    });
    return res.json({ success: true, ...result });
  }

  async adjustStock(req: Request, res: Response) {
    const validated = stockAdjustmentSchema.parse(req.body);
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const result = await inventoryService.adjustStock(validated, actor);
    return res.json({ success: true, data: result, message: "Stock adjustment recorded" });
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
}

export const inventoryController = new InventoryController();
