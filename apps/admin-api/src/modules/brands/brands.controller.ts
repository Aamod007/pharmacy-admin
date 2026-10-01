import { Request, Response } from "express";
import { brandsService } from "./brands.service";
import { brandCreateSchema, brandUpdateSchema } from "@pharmacy-admin/shared";

export class BrandsController {
  async list(req: Request, res: Response) {
    const data = await brandsService.list();
    return res.json({ success: true, data });
  }

  async create(req: Request, res: Response) {
    const validated = brandCreateSchema.parse(req.body);
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const data = await brandsService.create(validated, actor);
    return res.status(201).json({ success: true, data });
  }

  async update(req: Request, res: Response) {
    const validated = brandUpdateSchema.parse(req.body);
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const data = await brandsService.update(req.params.id, validated, actor);
    return res.json({ success: true, data });
  }

  async delete(req: Request, res: Response) {
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    await brandsService.delete(req.params.id, actor);
    return res.json({ success: true, message: "Brand deleted" });
  }
}

export const brandsController = new BrandsController();
