import { Request, Response } from "express";
import { bannersService } from "./banners.service";
import { bannerCreateSchema, bannerUpdateSchema } from "@pharmacy-admin/shared";

export class BannersController {
  async list(req: Request, res: Response) {
    const data = await bannersService.list();
    return res.json({ success: true, data });
  }

  async create(req: Request, res: Response) {
    const validated = bannerCreateSchema.parse(req.body);
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const data = await bannersService.create(validated, actor);
    return res.status(201).json({ success: true, data });
  }

  async update(req: Request, res: Response) {
    const validated = bannerUpdateSchema.parse(req.body);
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const data = await bannersService.update(req.params.id, validated, actor);
    return res.json({ success: true, data });
  }

  async delete(req: Request, res: Response) {
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    await bannersService.delete(req.params.id, actor);
    return res.json({ success: true, message: "Banner deleted" });
  }
}

export const bannersController = new BannersController();
