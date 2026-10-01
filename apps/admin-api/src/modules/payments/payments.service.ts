import prisma from "@pharmacy-admin/db";
import { razorpay } from "../../lib/razorpay";
import { RefundCreateInput } from "@pharmacy-admin/shared";
import { env } from "../../config/env";

export class PaymentsService {
  async listPayments(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: { select: { id: true, orderNumber: true, totalAmount: true, status: true, user: true } },
          refunds: true,
        },
      }),
      prisma.payment.count(),
    ]);

    return { data: payments, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async processRefund(input: RefundCreateInput, adminUserId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: input.paymentId },
      include: { order: true },
    });
    if (!payment) throw new Error("Payment record not found");

    let razorpayRefundId: string | null = null;

    // Trigger Razorpay Refund API if payment was online
    if (payment.razorpayPaymentId && !payment.razorpayPaymentId.startsWith("mock_")) {
      try {
        const rzpResponse: any = await razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: Math.round(input.amount * 100), // paise
          notes: { reason: input.reason, orderId: input.orderId },
        });
        razorpayRefundId = rzpResponse.id;
      } catch (err: any) {
        throw new Error(`Razorpay refund failed: ${err.error?.description || err.message}`);
      }
    } else {
      razorpayRefundId = `rfnd_manual_${Date.now()}`;
    }

    return prisma.$transaction(async (tx) => {
      const refund = await tx.refund.create({
        data: {
          paymentId: payment.id,
          orderId: input.orderId,
          razorpayRefundId,
          amount: input.amount,
          reason: input.reason,
          status: "PROCESSED",
          initiatedByUserId: adminUserId,
        },
      });

      // Update payment status to REFUNDED if total matches
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED" },
      });

      // Generate Credit Note if selected
      if (input.generateCreditNote) {
        const creditNoteNumber = `CN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await tx.adminCreditNote.create({
          data: {
            creditNoteNumber,
            orderId: input.orderId,
            refundId: refund.id,
            customerId: payment.order.userId,
            amount: input.amount,
            gstAmount: Number((input.amount * 0.12).toFixed(2)),
            reason: input.reason,
            status: "ISSUED",
            createdByAdminId: adminUserId,
          },
        });
      }

      return refund;
    });
  }

  async listRefunds(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          payment: true,
          order: { include: { user: true } },
          creditNotes: true,
        },
      }),
      prisma.refund.count(),
    ]);

    return { data: refunds, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async replayWebhook(eventId: string) {
    const event = await prisma.adminWebhookEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new Error("Webhook event not found");

    const response = await fetch(`${env.MAIN_SITE_URL}/api/internal/webhooks/replay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": env.INTERNAL_API_KEY,
      },
      body: JSON.stringify(event.payload),
    });

    if (!response.ok) {
      throw new Error(`Main site webhook replay returned HTTP ${response.status}`);
    }

    await prisma.adminWebhookEvent.update({
      where: { id: eventId },
      data: { attempts: event.attempts + 1, processedAt: new Date() },
    });

    return { success: true };
  }
}

export const paymentsService = new PaymentsService();
