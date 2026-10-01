import { Router } from "express";
import { ordersController } from "./orders.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";
import { auditMiddleware } from "../../middlewares/audit";

const router = Router();
router.use(authenticateAdmin);

router.get("/", requirePermission("orders:read"), (req, res, next) => ordersController.list(req, res).catch(next));
router.get("/:id", requirePermission("orders:read"), (req, res, next) => ordersController.getById(req, res).catch(next));
router.patch("/:id/status", requirePermission("orders:update"), auditMiddleware("Order", "STATUS_CHANGE"), (req, res, next) => ordersController.updateStatus(req, res).catch(next));
router.post("/:id/notes", requirePermission("orders:update"), (req, res, next) => ordersController.addNote(req, res).catch(next));

export default router;
