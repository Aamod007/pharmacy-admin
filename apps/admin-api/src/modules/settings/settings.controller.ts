import { Request, Response } from "express";
import { settingsService } from "./settings.service";

export class SettingsController {
  async getSettings(req: Request, res: Response) {
    const data = await settingsService.getAllSettings();
    return res.json({ success: true, data });
  }

  async updateSettings(req: Request, res: Response) {
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const data = await settingsService.updateSettings(req.body, actor);
    return res.json({ success: true, data, message: "Store settings updated" });
  }

  async checkHealth(req: Request, res: Response) {
    const data = await settingsService.checkHealth();
    return res.json({ success: true, data });
  }

  async manualRevalidate(req: Request, res: Response) {
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const result = await settingsService.triggerManualRevalidate(actor);
    return res.json(result);
  }
}

export const settingsController = new SettingsController();
