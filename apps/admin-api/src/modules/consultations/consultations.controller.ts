import { Request, Response } from "express";
import { consultationsService } from "./consultations.service";

export class ConsultationsController {
  async listDoctors(req: Request, res: Response) {
    const doctors = await consultationsService.listDoctors(req.query);
    return res.json({ success: true, data: doctors });
  }

  async createDoctor(req: Request, res: Response) {
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const doctor = await consultationsService.createDoctor(req.body, actor);
    return res.status(201).json({ success: true, data: doctor });
  }

  async updateDoctor(req: Request, res: Response) {
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const doctor = await consultationsService.updateDoctor(req.params.id, req.body, actor);
    return res.json({ success: true, data: doctor });
  }

  async deleteDoctor(req: Request, res: Response) {
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const result = await consultationsService.deleteDoctor(req.params.id, actor);
    return res.json({ success: true, data: result });
  }

  async listAppointments(req: Request, res: Response) {
    const result = await consultationsService.listAppointments(req.query);
    return res.json({ success: true, ...result });
  }

  async updateAppointment(req: Request, res: Response) {
    const appointment = await consultationsService.updateAppointment(req.params.id, req.body);
    return res.json({ success: true, data: appointment });
  }
}

export const consultationsController = new ConsultationsController();
