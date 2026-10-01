import { Request, Response } from "express";
import { ordersService } from "./orders.service";
import { orderStatusUpdateSchema, orderInternalCommentSchema } from "@pharmacy-admin/shared";

export class OrdersController {
  async list(req: Request, res: Response) {
    const result = await ordersService.listOrders({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      status: req.query.status as any,
      paymentStatus: req.query.paymentStatus as any,
      search: req.query.search as string,
      hasPrescription: req.query.hasPrescription === "true" ? true : req.query.hasPrescription === "false" ? false : undefined,
      paymentMethod: req.query.paymentMethod,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    return res.json({ success: true, ...result });
  }

  async getById(req: Request, res: Response) {
    const order = await ordersService.getOrderById(req.params.id);
    return res.json({ success: true, data: order });
  }

  async updateStatus(req: Request, res: Response) {
    const validated = orderStatusUpdateSchema.parse(req.body);
    const updated = await ordersService.updateStatus(
      req.params.id,
      validated.status,
      validated.note,
      req.admin!.adminUserId
    );
    return res.json({ success: true, data: updated, message: "Order status updated" });
  }

  async addNote(req: Request, res: Response) {
    const validated = orderInternalCommentSchema.parse(req.body);
    const updated = await ordersService.addInternalNote(req.params.id, validated.note);
    return res.json({ success: true, data: updated, message: "Note added to order" });
  }
}

export const ordersController = new OrdersController();
