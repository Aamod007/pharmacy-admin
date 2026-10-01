import prisma from "@pharmacy-admin/db";
import { BrandCreateInput, BrandUpdateInput } from "@pharmacy-admin/shared";
import { syncMutationToMainSite } from "../../lib/revalidate";

export class BrandsService {
  async list() {
    return prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
  }

  async create(input: BrandCreateInput, actor: { adminId: string; email: string }) {
    const brand = await prisma.brand.create({ data: input });
    syncMutationToMainSite({
      type: "brand.updated",
      entityId: brand.id,
      entityName: brand.name,
      tags: ["brands"],
      paths: ["/", "/products"],
      actor,
    });
    return brand;
  }

  async update(id: string, input: BrandUpdateInput, actor: { adminId: string; email: string }) {
    const brand = await prisma.brand.update({ where: { id }, data: input });
    syncMutationToMainSite({
      type: "brand.updated",
      entityId: brand.id,
      entityName: brand.name,
      tags: ["brands"],
      paths: ["/", "/products"],
      actor,
    });
    return brand;
  }

  async delete(id: string, actor: { adminId: string; email: string }) {
    const brand = await prisma.brand.delete({ where: { id } });
    syncMutationToMainSite({
      type: "brand.updated",
      entityId: id,
      tags: ["brands"],
      paths: ["/", "/products"],
      actor,
    });
    return brand;
  }
}

export const brandsService = new BrandsService();
