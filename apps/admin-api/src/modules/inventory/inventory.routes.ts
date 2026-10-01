import { Router } from "express";
import { inventoryController } from "./inventory.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";
import { auditMiddleware } from "../../middlewares/audit";

const router = Router();
router.use(authenticateAdmin);

router.get("/batches", requirePermission("inventory:read"), (req, res, next) => inventoryController.getBatches(req, res).catch(next));
router.patch("/batches/:id/block", requirePermission("inventory:update"), auditMiddleware("Inventory", "BLOCK_BATCH"), (req, res, next) => inventoryController.toggleBlock(req, res).catch(next));
router.post("/adjust", requirePermission("inventory:update"), auditMiddleware("Inventory", "STOCK_ADJUSTMENT"), (req, res, next) => inventoryController.adjustStock(req, res).catch(next));
router.get("/ledger", requirePermission("inventory:read"), (req, res, next) => inventoryController.getLedger(req, res).catch(next));

export default router;
