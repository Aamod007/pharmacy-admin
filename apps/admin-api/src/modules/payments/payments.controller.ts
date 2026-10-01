import { Request, Response } from "express";
import { paymentsService } from "./payments.service";
import { refundCreateSchema } from "@pharmacy-admin/shared";

export class PaymentsController {
  async list(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await paymentsService.listPayments(page, limit);
    return res.json({ success: true, ...result });
  }

  async listRefunds(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await paymentsService.listRefunds(page, limit);
    return res.json({ success: true, ...result });
  }

  async processRefund(req: Request, res: Response) {
    const validated = refundCreateSchema.parse(req.body);
    const refund = await paymentsService.processRefund(validated, req.admin!.adminUserId);
    return res.status(201).json({ success: true, data: refund, message: "Refund processed successfully" });
  }

  async replayWebhook(req: Request, res: Response) {
    await paymentsService.replayWebhook(req.params.id);
    return res.json({ success: true, message: "Webhook replayed to main store" });
  }

  async handleWebhook(req: Request, res: Response) {
    const signature = (req.headers["x-razorpay-signature"] as string) || "";
    const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const result = await paymentsService.handleWebhook(rawBody, signature, req.body);
    return res.status(200).json(result);
  }
}

export const paymentsController = new PaymentsController();
