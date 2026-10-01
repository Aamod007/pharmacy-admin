import { Router } from "express";
import { labTestsController } from "./labTests.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";
import { auditMiddleware } from "../../middlewares/audit";

const router = Router();
router.use(authenticateAdmin);

router.get("/", requirePermission("lab_tests:read"), (req, res, next) => labTestsController.listLabTests(req, res).catch(next));
router.post("/", requirePermission("lab_tests:create"), auditMiddleware("LabTest", "CREATE"), (req, res, next) => labTestsController.createLabTest(req, res).catch(next));
router.put("/:id", requirePermission("lab_tests:update"), auditMiddleware("LabTest", "UPDATE"), (req, res, next) => labTestsController.updateLabTest(req, res).catch(next));
router.delete("/:id", requirePermission("lab_tests:delete"), auditMiddleware("LabTest", "DELETE"), (req, res, next) => labTestsController.deleteLabTest(req, res).catch(next));

router.get("/bookings/list", requirePermission("lab_tests:read"), (req, res, next) => labTestsController.listBookings(req, res).catch(next));
router.put("/bookings/:id/status", requirePermission("lab_tests:update"), auditMiddleware("LabBooking", "STATUS_CHANGE"), (req, res, next) => labTestsController.updateBookingStatus(req, res).catch(next));

export default router;
