import { Router } from "express";
import { reviewsController } from "./reviews.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";
import { auditMiddleware } from "../../middlewares/audit";

const router = Router();
router.use(authenticateAdmin);

router.get("/", requirePermission("reviews:read"), (req, res, next) => reviewsController.listReviews(req, res).catch(next));
router.put("/:id/status", requirePermission("reviews:update"), auditMiddleware("Review", "STATUS_CHANGE"), (req, res, next) => reviewsController.updateStatus(req, res).catch(next));
router.delete("/:id", requirePermission("reviews:delete"), auditMiddleware("Review", "DELETE"), (req, res, next) => reviewsController.deleteReview(req, res).catch(next));

export default router;
