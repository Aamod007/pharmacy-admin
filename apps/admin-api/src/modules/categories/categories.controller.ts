import { Request, Response } from "express";
import { categoriesService } from "./categories.service";
import { categoryCreateSchema, categoryUpdateSchema } from "@pharmacy-admin/shared";

export class CategoriesController {
  async list(req: Request, res: Response) {
    const data = await categoriesService.list();
    return res.json({ success: true, data });
  }

  async create(req: Request, res: Response) {
    const validated = categoryCreateSchema.parse(req.body);
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const data = await categoriesService.create(validated, actor);
    return res.status(201).json({ success: true, data });
  }

  async update(req: Request, res: Response) {
    const validated = categoryUpdateSchema.parse(req.body);
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const data = await categoriesService.update(req.params.id, validated, actor);
    return res.json({ success: true, data });
  }

  async delete(req: Request, res: Response) {
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    await categoriesService.delete(req.params.id, actor);
    return res.json({ success: true, message: "Category deleted" });
  }
}

export const categoriesController = new CategoriesController();
