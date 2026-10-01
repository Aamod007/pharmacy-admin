import prisma from "@pharmacy-admin/db";
import { CouponCreateInput, CouponUpdateInput } from "@pharmacy-admin/shared";
import { syncMutationToMainSite } from "../../lib/revalidate";

export class CouponsService {
  async list() {
    return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  }

  async create(input: CouponCreateInput, actor: { adminId: string; email: string }) {
    const coupon = await prisma.coupon.create({
      data: {
        ...input,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      },
    });
    syncMutationToMainSite({
      type: "coupon.updated",
      entityId: coupon.id,
      entityName: coupon.code,
      tags: ["coupons"],
      paths: ["/cart", "/checkout"],
      actor,
    });
    return coupon;
  }

  async update(id: string, input: CouponUpdateInput, actor: { adminId: string; email: string }) {
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      },
    });
    syncMutationToMainSite({
      type: "coupon.updated",
      entityId: coupon.id,
      entityName: coupon.code,
      tags: ["coupons"],
      paths: ["/cart", "/checkout"],
      actor,
    });
    return coupon;
  }

  async delete(id: string, actor: { adminId: string; email: string }) {
    await prisma.coupon.delete({ where: { id } });
    syncMutationToMainSite({
      type: "coupon.updated",
      entityId: id,
      tags: ["coupons"],
      paths: ["/cart", "/checkout"],
      actor,
    });
    return { success: true };
  }
}

export const couponsService = new CouponsService();
