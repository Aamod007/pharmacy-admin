import prisma from "@pharmacy-admin/db";
import { BannerCreateInput, BannerUpdateInput } from "@pharmacy-admin/shared";
import { syncMutationToMainSite } from "../../lib/revalidate";

export class BannersService {
  async list() {
    return prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async create(input: BannerCreateInput, actor: { adminId: string; email: string }) {
    const banner = await prisma.banner.create({ data: input });
    syncMutationToMainSite({
      type: "banner.updated",
      entityId: banner.id,
      tags: ["banners"],
      paths: ["/"],
      actor,
    });
    return banner;
  }

  async update(id: string, input: BannerUpdateInput, actor: { adminId: string; email: string }) {
    const banner = await prisma.banner.update({ where: { id }, data: input });
    syncMutationToMainSite({
      type: "banner.updated",
      entityId: banner.id,
      tags: ["banners"],
      paths: ["/"],
      actor,
    });
    return banner;
  }

  async delete(id: string, actor: { adminId: string; email: string }) {
    await prisma.banner.delete({ where: { id } });
    syncMutationToMainSite({
      type: "banner.updated",
      entityId: id,
      tags: ["banners"],
      paths: ["/"],
      actor,
    });
    return { success: true };
  }
}

export const bannersService = new BannersService();
