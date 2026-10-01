import prisma from "@pharmacy-admin/db";
import { syncMutationToMainSite } from "../../lib/revalidate";

export class ReviewsService {
  async listReviews(query: { page?: number; limit?: number; search?: string; isApproved?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.isApproved !== undefined && query.isApproved !== "ALL") {
      where.isApproved = query.isApproved === "true";
    }
    if (query.search) {
      where.OR = [
        { comment: { contains: query.search, mode: "insensitive" } },
        { product: { name: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { id: true, name: true, slug: true, images: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateReviewStatus(id: string, isApproved: boolean, actor: { adminId: string; email: string }) {
    const review = await prisma.review.update({
      where: { id },
      data: { isApproved },
      include: { product: true },
    });

    syncMutationToMainSite({
      type: "review.updated",
      entityId: review.productId,
      tags: ["reviews", `product:${review.productId}`],
      paths: [`/products/${review.product.slug}`],
      actor,
    });

    return review;
  }

  async deleteReview(id: string, actor: { adminId: string; email: string }) {
    const review = await prisma.review.delete({
      where: { id },
      include: { product: true },
    });

    syncMutationToMainSite({
      type: "review.updated",
      entityId: review.productId,
      tags: ["reviews"],
      paths: [`/products/${review.product.slug}`],
      actor,
    });

    return { success: true };
  }
}

export const reviewsService = new ReviewsService();
