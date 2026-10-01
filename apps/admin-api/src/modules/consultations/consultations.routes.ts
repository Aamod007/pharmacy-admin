import { Router } from "express";
import { consultationsController } from "./consultations.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";
import { auditMiddleware } from "../../middlewares/audit";

const router = Router();
router.use(authenticateAdmin);

router.get("/doctors", requirePermission("consultations:read"), (req, res, next) => consultationsController.listDoctors(req, res).catch(next));
router.post("/doctors", requirePermission("consultations:create"), auditMiddleware("Doctor", "CREATE"), (req, res, next) => consultationsController.createDoctor(req, res).catch(next));
router.put("/doctors/:id", requirePermission("consultations:update"), auditMiddleware("Doctor", "UPDATE"), (req, res, next) => consultationsController.updateDoctor(req, res).catch(next));
router.delete("/doctors/:id", requirePermission("consultations:delete"), auditMiddleware("Doctor", "DELETE"), (req, res, next) => consultationsController.deleteDoctor(req, res).catch(next));

router.get("/appointments", requirePermission("consultations:read"), (req, res, next) => consultationsController.listAppointments(req, res).catch(next));
router.put("/appointments/:id", requirePermission("consultations:update"), auditMiddleware("Appointment", "UPDATE"), (req, res, next) => consultationsController.updateAppointment(req, res).catch(next));

export default router;
