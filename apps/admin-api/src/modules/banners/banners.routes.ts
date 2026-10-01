import { Router } from "express";
import { bannersController } from "./banners.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";
import { auditMiddleware } from "../../middlewares/audit";

const router = Router();
router.use(authenticateAdmin);

router.get("/", requirePermission("banners:read"), (req, res, next) => bannersController.list(req, res).catch(next));
router.post("/", requirePermission("banners:create"), auditMiddleware("Banner", "CREATE"), (req, res, next) => bannersController.create(req, res).catch(next));
router.put("/:id", requirePermission("banners:update"), auditMiddleware("Banner", "UPDATE"), (req, res, next) => bannersController.update(req, res).catch(next));
router.delete("/:id", requirePermission("banners:delete"), auditMiddleware("Banner", "DELETE"), (req, res, next) => bannersController.delete(req, res).catch(next));

export default router;
