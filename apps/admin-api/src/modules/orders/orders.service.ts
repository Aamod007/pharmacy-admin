import prisma from "@pharmacy-admin/db";
import { OrderStatus, PaymentStatus } from "@pharmacy-admin/shared";
import { sendEmailWithTemplate } from "../../lib/mailer";

// Strict state transition map
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  PACKED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [OrderStatus.RETURN_REQUESTED],
  RETURN_REQUESTED: [OrderStatus.RETURNED],
  RETURNED: [],
  CANCELLED: [],
};

export class OrdersService {
  async listOrders(params: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    search?: string;
    hasPrescription?: boolean;
    paymentMethod?: any;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.paymentStatus) where.paymentStatus = params.paymentStatus;
    if (params.paymentMethod) where.paymentMethod = params.paymentMethod;

    if (params.hasPrescription !== undefined) {
      where.prescriptionId = params.hasPrescription ? { not: null } : null;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    if (params.search) {
      where.OR = [
        { orderNumber: { contains: params.search, mode: "insensitive" } },
        { user: { name: { contains: params.search, mode: "insensitive" } } },
        { user: { phone: { contains: params.search } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          address: true,
          prescription: { select: { id: true, status: true, fileUrl: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        address: true,
        prescription: true,
        coupon: true,
        items: {
          include: {
            variant: {
              include: {
                batches: {
                  where: { isBlocked: false, quantity: { gt: 0 } },
                  orderBy: { expiryDate: "asc" }, // FEFO candidate batches
                },
              },
            },
          },
        },
        statusHistory: {
          include: { changedBy: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
        payments: true,
        refunds: true,
        creditNotes: true,
      },
    });

    if (!order) throw new Error("Order not found");
    return order;
  }

  async updateStatus(
    orderId: string,
    newStatus: OrderStatus,
    note: string | undefined,
    adminUserId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { prescription: true, items: true, user: true },
      });

      if (!order) throw new Error("Order not found");

      // Validate State Machine Transition
      const allowedNext = ALLOWED_TRANSITIONS[order.status as OrderStatus] || [];
      if (!allowedNext.includes(newStatus)) {
        throw new Error(
          `Invalid order status transition from '${order.status}' to '${newStatus}'. Allowed: ${allowedNext.join(", ")}`
        );
      }

      // Pharmacy Regulatory Guard: Rx check
      if (newStatus === OrderStatus.CONFIRMED && order.prescriptionId) {
        if (!order.prescription || order.prescription.status !== "APPROVED") {
          throw new Error(
            "Cannot CONFIRM order with prescription required items: Doctor prescription is not yet APPROVED by a pharmacist."
          );
        }
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          isPaid: newStatus === OrderStatus.DELIVERED ? true : order.isPaid,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: newStatus,
          note,
          changedByUserId: adminUserId,
        },
      });

      return updated;
    });
  }

  async addInternalNote(orderId: string, note: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    const currentNotes = order.notes ? `${order.notes}\n---\n${note}` : note;
    return prisma.order.update({
      where: { id: orderId },
      data: { notes: currentNotes },
    });
  }
}

export const ordersService = new OrdersService();
