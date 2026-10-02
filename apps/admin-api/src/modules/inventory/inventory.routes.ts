import { Router } from "express";
import { inventoryController } from "./inventory.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";
import { auditMiddleware } from "../../middlewares/audit";

const router = Router();
router.use(authenticateAdmin);

router.get("/batches", requirePermission("inventory:read"), (req, res, next) => inventoryController.getBatches(req, res).catch(next));
router.post("/batches", requirePermission("inventory:create"), auditMiddleware("Inventory", "CREATE_BATCH"), (req, res, next) => inventoryController.createBatch(req, res).catch(next));
router.patch("/batches/:id", requirePermission("inventory:update"), auditMiddleware("Inventory", "UPDATE_BATCH"), (req, res, next) => inventoryController.updateBatch(req, res).catch(next));
router.delete("/batches/:id", requirePermission("inventory:delete"), auditMiddleware("Inventory", "DELETE_BATCH"), (req, res, next) => inventoryController.deleteBatch(req, res).catch(next));
router.patch("/batches/:id/block", requirePermission("inventory:update"), auditMiddleware("Inventory", "BLOCK_BATCH"), (req, res, next) => inventoryController.toggleBlock(req, res).catch(next));
router.post("/batches/:id/write-off", requirePermission("inventory:update"), auditMiddleware("Inventory", "EXPIRY_WRITEOFF"), (req, res, next) => inventoryController.writeOffBatch(req, res).catch(next));

router.post("/purchases", requirePermission("inventory:create"), auditMiddleware("Inventory", "PURCHASE_ENTRY"), (req, res, next) => inventoryController.createPurchaseEntry(req, res).catch(next));
router.post("/adjust", requirePermission("inventory:update"), auditMiddleware("Inventory", "STOCK_ADJUSTMENT"), (req, res, next) => inventoryController.adjustStock(req, res).catch(next));
router.get("/ledger", requirePermission("inventory:read"), (req, res, next) => inventoryController.getLedger(req, res).catch(next));
router.get("/export", requirePermission("inventory:export"), (req, res, next) => inventoryController.exportCsv(req, res).catch(next));
router.get("/valuation", requirePermission("inventory:read"), (req, res, next) => inventoryController.getValuation(req, res).catch(next));

export default router;
