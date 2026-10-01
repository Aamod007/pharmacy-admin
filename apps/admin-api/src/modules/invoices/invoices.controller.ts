import { Request, Response } from "express";
import { invoicesService } from "./invoices.service";

export class InvoicesController {
  async listInvoices(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string;
    const result = await invoicesService.listInvoices(page, limit, search);
    return res.json({ success: true, ...result });
  }

  async listCreditNotes(req: Request, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await invoicesService.listCreditNotes(page, limit);
    return res.json({ success: true, ...result });
  }

  async downloadInvoicePdf(req: Request, res: Response) {
    const pdfBytes = await invoicesService.generateOrderInvoicePdf(req.params.orderId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Invoice-${req.params.orderId}.pdf"`);
    return res.send(Buffer.from(pdfBytes));
  }
}

export const invoicesController = new InvoicesController();
