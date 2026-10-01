import { Router } from "express";
import { productsController } from "./products.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";
import { auditMiddleware } from "../../middlewares/audit";

const router = Router();

router.use(authenticateAdmin);

router.get("/", requirePermission("products:read"), (req, res, next) =>
  productsController.list(req, res).catch(next)
);

router.get("/:id", requirePermission("products:read"), (req, res, next) =>
  productsController.getById(req, res).catch(next)
);

router.post(
  "/",
  requirePermission("products:create"),
  auditMiddleware("Product", "CREATE"),
  (req, res, next) => productsController.create(req, res).catch(next)
);

router.put(
  "/:id",
  requirePermission("products:update"),
  auditMiddleware("Product", "UPDATE"),
  (req, res, next) => productsController.update(req, res).catch(next)
);

router.delete(
  "/:id",
  requirePermission("products:delete"),
  auditMiddleware("Product", "DELETE"),
  (req, res, next) => productsController.delete(req, res).catch(next)
);

export default router;
