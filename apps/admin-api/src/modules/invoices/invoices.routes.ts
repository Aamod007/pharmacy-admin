import { Router } from "express";
import { invoicesController } from "./invoices.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/rbac";

const router = Router();
router.use(authenticateAdmin);

router.get("/", requirePermission("invoices:read"), (req, res, next) => invoicesController.listInvoices(req, res).catch(next));
router.get("/credit-notes", requirePermission("invoices:read"), (req, res, next) => invoicesController.listCreditNotes(req, res).catch(next));
router.get("/:orderId/pdf", requirePermission("invoices:read"), (req, res, next) => invoicesController.downloadInvoicePdf(req, res).catch(next));

export default router;
