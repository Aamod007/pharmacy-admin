import { Request, Response } from "express";
import { productsService } from "./products.service";
import { fullProductWizardSchema } from "@pharmacy-admin/shared";

export class ProductsController {
  async list(req: Request, res: Response) {
    const result = await productsService.listProducts({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      search: req.query.search as string,
      categoryId: req.query.categoryId as string,
      brandId: req.query.brandId as string,
      isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
      prescriptionRequired:
        req.query.prescriptionRequired === "true"
          ? true
          : req.query.prescriptionRequired === "false"
          ? false
          : undefined,
    });
    return res.json({ success: true, ...result });
  }

  async getById(req: Request, res: Response) {
    const product = await productsService.getProductById(req.params.id);
    return res.json({ success: true, data: product });
  }

  async create(req: Request, res: Response) {
    const validated = fullProductWizardSchema.parse(req.body);
    const actor = {
      adminId: req.admin!.adminUserId,
      email: req.admin!.email,
    };
    const product = await productsService.createProductWizard(validated, actor);
    return res.status(201).json({ success: true, data: product, message: "Product created successfully" });
  }

  async update(req: Request, res: Response) {
    const actor = {
      adminId: req.admin!.adminUserId,
      email: req.admin!.email,
    };
    const updated = await productsService.updateProduct(req.params.id, req.body, actor);
    return res.json({ success: true, data: updated, message: "Product updated successfully" });
  }

  async delete(req: Request, res: Response) {
    const actor = {
      adminId: req.admin!.adminUserId,
      email: req.admin!.email,
    };
    await productsService.deleteProduct(req.params.id, actor);
    return res.json({ success: true, message: "Product deleted successfully" });
  }
}

export const productsController = new ProductsController();
