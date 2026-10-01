import { Router } from "express";
import { dashboardController } from "./dashboard.controller";
import { authenticateAdmin } from "../../middlewares/auth";

const router = Router();

router.use(authenticateAdmin);
router.get("/stats", (req, res, next) => dashboardController.getKpis(req, res).catch(next));
router.get("/sales-chart", (req, res, next) => dashboardController.getSalesChart(req, res).catch(next));
router.get("/status-donut", (req, res, next) => dashboardController.getStatusDonut(req, res).catch(next));
router.get("/top-products", (req, res, next) => dashboardController.getTopProducts(req, res).catch(next));
router.get("/payment-distribution", (req, res, next) => dashboardController.getPaymentDistribution(req, res).catch(next));

export default router;
