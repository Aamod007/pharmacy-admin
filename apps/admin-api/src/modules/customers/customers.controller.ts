import { Request, Response } from "express";
import { customersService } from "./customers.service";

export class CustomersController {
  async list(req: Request, res: Response) {
    const result = await customersService.list({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      search: req.query.search as string,
      isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
    });
    return res.json({ success: true, ...result });
  }

  async getById(req: Request, res: Response) {
    const customer = await customersService.getById(req.params.id);
    return res.json({ success: true, data: customer });
  }

  async toggleActive(req: Request, res: Response) {
    const { isActive } = req.body;
    const updated = await customersService.toggleActive(req.params.id, Boolean(isActive));
    return res.json({ success: true, data: updated, message: "Customer status updated" });
  }
}

export const customersController = new CustomersController();
