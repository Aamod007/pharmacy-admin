import { Request, Response } from "express";
import { prescriptionsService } from "./prescriptions.service";
import { prescriptionApproveSchema, prescriptionRejectSchema } from "@pharmacy-admin/shared";

export class PrescriptionsController {
  async list(req: Request, res: Response) {
    const status = req.query.status as any;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await prescriptionsService.listQueue(status, page, limit);
    return res.json({ success: true, ...result });
  }

  async getById(req: Request, res: Response) {
    const rx = await prescriptionsService.getById(req.params.id);
    return res.json({ success: true, data: rx });
  }

  async approve(req: Request, res: Response) {
    const validated = prescriptionApproveSchema.parse(req.body);
    const updated = await prescriptionsService.approvePrescription(
      req.params.id,
      new Date(validated.validityDate),
      validated.notes,
      req.admin!.adminUserId
    );
    return res.json({ success: true, data: updated, message: "Prescription approved" });
  }

  async reject(req: Request, res: Response) {
    const validated = prescriptionRejectSchema.parse(req.body);
    const updated = await prescriptionsService.rejectPrescription(
      req.params.id,
      validated.reason,
      validated.notes,
      req.admin!.adminUserId
    );
    return res.json({ success: true, data: updated, message: "Prescription rejected" });
  }
}

export const prescriptionsController = new PrescriptionsController();
