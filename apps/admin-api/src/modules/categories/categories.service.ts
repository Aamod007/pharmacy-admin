import prisma from "@pharmacy-admin/db";
import { CategoryCreateInput, CategoryUpdateInput } from "@pharmacy-admin/shared";
import { syncMutationToMainSite } from "../../lib/revalidate";

export class CategoriesService {
  async list() {
    return prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
  }

  async create(input: CategoryCreateInput, actor: { adminId: string; email: string }) {
    const category = await prisma.category.create({ data: input });
    syncMutationToMainSite({
      type: "category.updated",
      entityId: category.id,
      entityName: category.name,
      tags: ["categories"],
      paths: ["/", "/products"],
      actor,
    });
    return category;
  }

  async update(id: string, input: CategoryUpdateInput, actor: { adminId: string; email: string }) {
    const category = await prisma.category.update({ where: { id }, data: input });
    syncMutationToMainSite({
      type: "category.updated",
      entityId: category.id,
      entityName: category.name,
      tags: ["categories"],
      paths: ["/", "/products"],
      actor,
    });
    return category;
  }

  async delete(id: string, actor: { adminId: string; email: string }) {
    const category = await prisma.category.delete({ where: { id } });
    syncMutationToMainSite({
      type: "category.updated",
      entityId: id,
      tags: ["categories"],
      paths: ["/", "/products"],
      actor,
    });
    return category;
  }
}

export const categoriesService = new CategoriesService();
