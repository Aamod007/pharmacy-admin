import { Router } from "express";
import { customersController } from "./customers.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";
import { auditMiddleware } from "../../middlewares/audit";

const router = Router();
router.use(authenticateAdmin);

router.get("/", requirePermission("customers:read"), (req, res, next) => customersController.list(req, res).catch(next));
router.get("/:id", requirePermission("customers:read"), (req, res, next) => customersController.getById(req, res).catch(next));
router.patch("/:id/status", requirePermission("customers:update"), auditMiddleware("Customer", "STATUS_CHANGE"), (req, res, next) => customersController.toggleActive(req, res).catch(next));

export default router;
