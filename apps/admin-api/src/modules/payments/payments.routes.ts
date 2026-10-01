import { Router } from "express";
import { paymentsController } from "./payments.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";
import { auditMiddleware } from "../../middlewares/audit";

const router = Router();
router.use(authenticateAdmin);

router.get("/", requirePermission("payments:read"), (req, res, next) => paymentsController.list(req, res).catch(next));
router.get("/refunds", requirePermission("refunds:read"), (req, res, next) => paymentsController.listRefunds(req, res).catch(next));
router.post("/refunds", requirePermission("refunds:create"), auditMiddleware("Refund", "PROCESS_REFUND"), (req, res, next) => paymentsController.processRefund(req, res).catch(next));
router.post("/webhooks/:id/replay", requirePermission("payments:update"), (req, res, next) => paymentsController.replayWebhook(req, res).catch(next));

export default router;
