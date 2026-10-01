import { Request, Response } from "express";
import { staffService } from "./staff.service";
import { staffInviteSchema } from "@pharmacy-admin/shared";

export class StaffController {
  async listStaff(req: Request, res: Response) {
    const data = await staffService.listStaff();
    return res.json({ success: true, data });
  }

  async listRoles(req: Request, res: Response) {
    const data = await staffService.listRoles();
    return res.json({ success: true, data });
  }

  async listPermissions(req: Request, res: Response) {
    const data = await staffService.listPermissions();
    return res.json({ success: true, data });
  }

  async invite(req: Request, res: Response) {
    const validated = staffInviteSchema.parse(req.body);
    const result = await staffService.inviteStaff(validated);
    return res.status(201).json({ success: true, data: result.user, message: "Staff invited successfully" });
  }
}

export const staffController = new StaffController();
