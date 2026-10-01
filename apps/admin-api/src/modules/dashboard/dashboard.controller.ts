import { Request, Response } from "express";
import { dashboardService } from "./dashboard.service";

export class DashboardController {
  async getKpis(req: Request, res: Response) {
    const data = await dashboardService.getDashboardKpis();
    return res.json({ success: true, data });
  }

  async getSalesChart(req: Request, res: Response) {
    const days = Number(req.query.days) || 30;
    const data = await dashboardService.getSalesChart(days);
    return res.json({ success: true, data });
  }

  async getStatusDonut(req: Request, res: Response) {
    const data = await dashboardService.getOrdersByStatusDonut();
    return res.json({ success: true, data });
  }

  async getTopProducts(req: Request, res: Response) {
    const data = await dashboardService.getTopSellingProducts(5);
    return res.json({ success: true, data });
  }

  async getPaymentDistribution(req: Request, res: Response) {
    const data = await dashboardService.getPaymentMethodDistribution();
    return res.json({ success: true, data });
  }
}

export const dashboardController = new DashboardController();
