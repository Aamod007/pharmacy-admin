import { Request, Response } from "express";
import { labTestsService } from "./labTests.service";

export class LabTestsController {
  async listLabTests(req: Request, res: Response) {
    const tests = await labTestsService.listLabTests(req.query);
    return res.json({ success: true, data: tests });
  }

  async createLabTest(req: Request, res: Response) {
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const test = await labTestsService.createLabTest(req.body, actor);
    return res.status(201).json({ success: true, data: test });
  }

  async updateLabTest(req: Request, res: Response) {
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const test = await labTestsService.updateLabTest(req.params.id, req.body, actor);
    return res.json({ success: true, data: test });
  }

  async deleteLabTest(req: Request, res: Response) {
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const result = await labTestsService.deleteLabTest(req.params.id, actor);
    return res.json({ success: true, data: result });
  }

  async listBookings(req: Request, res: Response) {
    const result = await labTestsService.listBookings(req.query);
    return res.json({ success: true, ...result });
  }

  async updateBookingStatus(req: Request, res: Response) {
    const { status, reportUrl } = req.body;
    const booking = await labTestsService.updateBookingStatus(req.params.id, status, reportUrl);
    return res.json({ success: true, data: booking });
  }
}

export const labTestsController = new LabTestsController();
