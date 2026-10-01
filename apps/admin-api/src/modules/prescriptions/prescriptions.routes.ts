import { Router } from "express";
import { prescriptionsController } from "./prescriptions.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";
import { auditMiddleware } from "../../middlewares/audit";

const router = Router();
router.use(authenticateAdmin);

router.get("/", requirePermission("prescriptions:read"), (req, res, next) => prescriptionsController.list(req, res).catch(next));
router.get("/:id", requirePermission("prescriptions:read"), (req, res, next) => prescriptionsController.getById(req, res).catch(next));
router.post("/:id/approve", requirePermission("prescriptions:update"), auditMiddleware("Prescription", "APPROVE"), (req, res, next) => prescriptionsController.approve(req, res).catch(next));
router.post("/:id/reject", requirePermission("prescriptions:update"), auditMiddleware("Prescription", "REJECT"), (req, res, next) => prescriptionsController.reject(req, res).catch(next));

export default router;
