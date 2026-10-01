import { Request, Response } from "express";
import { reviewsService } from "./reviews.service";

export class ReviewsController {
  async listReviews(req: Request, res: Response) {
    const result = await reviewsService.listReviews(req.query);
    return res.json({ success: true, ...result });
  }

  async updateStatus(req: Request, res: Response) {
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const { isApproved } = req.body;
    const review = await reviewsService.updateReviewStatus(req.params.id, Boolean(isApproved), actor);
    return res.json({ success: true, data: review });
  }

  async deleteReview(req: Request, res: Response) {
    const actor = { adminId: req.admin!.adminUserId, email: req.admin!.email };
    const result = await reviewsService.deleteReview(req.params.id, actor);
    return res.json({ success: true, data: result });
  }
}

export const reviewsController = new ReviewsController();
