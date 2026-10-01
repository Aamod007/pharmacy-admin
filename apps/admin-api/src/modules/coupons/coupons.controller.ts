import { Request, Response } from "express";
import { couponsService } from "./coupons.service";
import { couponCreateSchema, couponUpdateSchema } from "@pharmacy-admin/shared";

export class CouponsController {
  async list(req: Request, res: Response) {
    const data = await couponsService.list();
    return res.json({ success: true, data });
  }

  async create(req: Request, res: Response) {
    const validated = couponCreateSchema.parse(req.body);
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const data = await couponsService.create(validated, actor);
    return res.status(201).json({ success: true, data });
  }

  async update(req: Request, res: Response) {
    const validated = couponUpdateSchema.parse(req.body);
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const data = await couponsService.update(req.params.id, validated, actor);
    return res.json({ success: true, data });
  }

  async delete(req: Request, res: Response) {
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    await couponsService.delete(req.params.id, actor);
    return res.json({ success: true, message: "Coupon deleted" });
  }
}

export const couponsController = new CouponsController();
