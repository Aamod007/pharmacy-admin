import { Router } from "express";
import { staffController } from "./staff.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";
import { auditMiddleware } from "../../middlewares/audit";

const router = Router();
router.use(authenticateAdmin);

router.get("/users", requirePermission("staff:read"), (req, res, next) => staffController.listStaff(req, res).catch(next));
router.post("/invite", requirePermission("staff:create"), auditMiddleware("Staff", "INVITE"), (req, res, next) => staffController.invite(req, res).catch(next));
router.get("/roles", requirePermission("roles:read"), (req, res, next) => staffController.listRoles(req, res).catch(next));
router.get("/permissions", requirePermission("roles:read"), (req, res, next) => staffController.listPermissions(req, res).catch(next));

export default router;
