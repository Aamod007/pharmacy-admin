import { Router } from "express";
import { brandsController } from "./brands.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";
import { auditMiddleware } from "../../middlewares/audit";

const router = Router();
router.use(authenticateAdmin);

router.get("/", requirePermission("brands:read"), (req, res, next) => brandsController.list(req, res).catch(next));
router.post("/", requirePermission("brands:create"), auditMiddleware("Brand", "CREATE"), (req, res, next) => brandsController.create(req, res).catch(next));
router.put("/:id", requirePermission("brands:update"), auditMiddleware("Brand", "UPDATE"), (req, res, next) => brandsController.update(req, res).catch(next));
router.delete("/:id", requirePermission("brands:delete"), auditMiddleware("Brand", "DELETE"), (req, res, next) => brandsController.delete(req, res).catch(next));

export default router;
