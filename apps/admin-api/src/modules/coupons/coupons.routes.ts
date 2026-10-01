import { Router } from "express";
import { couponsController } from "./coupons.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";
import { auditMiddleware } from "../../middlewares/audit";

const router = Router();
router.use(authenticateAdmin);

router.get("/", requirePermission("coupons:read"), (req, res, next) => couponsController.list(req, res).catch(next));
router.post("/", requirePermission("coupons:create"), auditMiddleware("Coupon", "CREATE"), (req, res, next) => couponsController.create(req, res).catch(next));
router.put("/:id", requirePermission("coupons:update"), auditMiddleware("Coupon", "UPDATE"), (req, res, next) => couponsController.update(req, res).catch(next));
router.delete("/:id", requirePermission("coupons:delete"), auditMiddleware("Coupon", "DELETE"), (req, res, next) => couponsController.delete(req, res).catch(next));

export default router;
