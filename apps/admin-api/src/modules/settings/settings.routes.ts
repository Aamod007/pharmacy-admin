import { Router } from "express";
import { settingsController } from "./settings.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";
import { auditMiddleware } from "../../middlewares/audit";

const router = Router();
router.use(authenticateAdmin);

router.get("/", requirePermission("settings:read"), (req, res, next) => settingsController.getSettings(req, res).catch(next));
router.put("/", requirePermission("settings:update"), auditMiddleware("Setting", "UPDATE"), (req, res, next) => settingsController.updateSettings(req, res).catch(next));
router.get("/health", (req, res, next) => settingsController.checkHealth(req, res).catch(next));
router.post("/revalidate-now", requirePermission("settings:update"), (req, res, next) => settingsController.manualRevalidate(req, res).catch(next));
router.post("/retry-sync", requirePermission("settings:update"), (req, res, next) => settingsController.retrySync(req, res).catch(next));

export default router;
