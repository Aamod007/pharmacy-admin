import { Router } from "express";
import { auditService } from "./audit.service";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";

const router = Router();
router.use(authenticateAdmin);

router.get("/", requirePermission("audit_logs:read"), async (req, res, next) => {
  try {
    const result = await auditService.listLogs({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      entity: req.query.entity as string,
      action: req.query.action as string,
    });
    return res.json({ success: true, ...result });
  } catch (e) {
    next(e);
  }
});

export default router;
