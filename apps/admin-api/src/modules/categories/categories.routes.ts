import { Router } from "express";
import { categoriesController } from "./categories.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";
import { auditMiddleware } from "../../middlewares/audit";

const router = Router();
router.use(authenticateAdmin);

router.get("/", requirePermission("categories:read"), (req, res, next) => categoriesController.list(req, res).catch(next));
router.post("/", requirePermission("categories:create"), auditMiddleware("Category", "CREATE"), (req, res, next) => categoriesController.create(req, res).catch(next));
router.put("/:id", requirePermission("categories:update"), auditMiddleware("Category", "UPDATE"), (req, res, next) => categoriesController.update(req, res).catch(next));
router.delete("/:id", requirePermission("categories:delete"), auditMiddleware("Category", "DELETE"), (req, res, next) => categoriesController.delete(req, res).catch(next));

export default router;
