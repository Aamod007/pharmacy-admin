import prisma from "@pharmacy-admin/db";
import { OrderStatus, PaymentStatus } from "@pharmacy-admin/shared";
import { sendEmailWithTemplate } from "../../lib/mailer";
import { inventoryService } from "../inventory/inventory.service";
import { syncMutationToMainSite } from "../../lib/revalidate";
import { resolveAdminUserId } from "../../lib/admin-user";

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

interface CachedOrdersResult {
  data: any[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  cachedAt: number;
}

const ordersCache = new Map<string, CachedOrdersResult>();
const ORDERS_CACHE_TTL_MS = 15000; // 15s in-memory cache to eliminate remote DB latency

export function invalidateOrdersCache() {
  ordersCache.clear();
}

export class OrdersService {
  async listOrders(params: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    search?: string;
    paymentMethod?: any;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const cacheKey = JSON.stringify({
      page,
      limit,
      status: params.status || "ALL",
      paymentStatus: params.paymentStatus || "ALL",
      paymentMethod: params.paymentMethod || "ALL",
      search: (params.search || "").trim().toLowerCase(),
      startDate: params.startDate || "",
      endDate: params.endDate || "",
    });

    const cached = ordersCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < ORDERS_CACHE_TTL_MS) {
      return { data: cached.data, meta: cached.meta };
    }

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.paymentStatus) where.paymentStatus = params.paymentStatus;
    if (params.paymentMethod) where.paymentMethod = params.paymentMethod;

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

    // Ensure only genuine customer orders appear in the admin panel
    where.NOT = [
      { orderNumber: { startsWith: "ORD-" } },
      { orderNumber: { contains: "TEST" } },
      { orderNumber: { contains: "RACE" } },
      { orderNumber: { contains: "SYNC" } },
    ];

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          address: true,
          items: {
            select: {
              id: true,
              productName: true,
              packSize: true,
              sku: true,
              price: true,
              mrp: true,
              quantity: true,
              subtotal: true,
            },
          },
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const result = {
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    ordersCache.set(cacheKey, { ...result, cachedAt: Date.now() });
    return result;
  }

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        address: true,
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
    const { updated, restoredProductIds } = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, user: true },
      });

      if (!order) throw new Error("Order not found");

      // Idempotency: If already in requested status, return early without re-processing
      if (order.status === newStatus) {
        return { updated: order, restoredProductIds: [] };
      }

      // Validate State Machine Transition
      const allowedNext = ALLOWED_TRANSITIONS[order.status as OrderStatus] || [];
      if (!allowedNext.includes(newStatus)) {
        throw new Error(
          `Invalid order status transition from '${order.status}' to '${newStatus}'. Allowed: ${allowedNext.join(", ")}`
        );
      }

      // S3 & S8: If moving to CONFIRMED, allocate stock via FEFO if not already allocated
      if (newStatus === OrderStatus.CONFIRMED) {
        const existingAllocations = await tx.adminStockMovement.count({
          where: { referenceId: orderId, type: "SALE" },
        });
        if (existingAllocations === 0) {
          const validAdminId = await resolveAdminUserId(adminUserId, undefined, tx);
          await inventoryService.allocateFefoOrder(
            orderId,
            { adminId: validAdminId || "", email: "" },
            tx
          );
        }
      }

      // S8: If moving to CANCELLED, restore allocated batches exactly
      const restoredProducts = new Set<string>();
      if (newStatus === OrderStatus.CANCELLED) {
        const salesMovements = await tx.adminStockMovement.findMany({
          where: { referenceId: orderId, type: "SALE" },
          include: { variant: { include: { product: true } } },
        });

        const validAdminId = await resolveAdminUserId(adminUserId, undefined, tx);

        for (const sm of salesMovements) {
          if (sm.batchId) {
            const batch = await tx.inventoryBatch.findUnique({ where: { id: sm.batchId } });
            if (batch) {
              const previousStock = batch.quantity;
              const newStock = previousStock + sm.quantity;
              await tx.inventoryBatch.update({
                where: { id: batch.id },
                data: { quantity: newStock },
              });

              await tx.adminStockMovement.create({
                data: {
                  variantId: sm.variantId,
                  batchId: batch.id,
                  type: "RETURN_RESTOCK",
                  quantity: sm.quantity,
                  previousStock,
                  newStock,
                  referenceId: orderId,
                  referenceType: "ORDER_CANCEL",
                  reason: `Stock restored upon cancellation of order #${order.orderNumber}`,
                  createdByAdminId: validAdminId,
                },
              });

              if (sm.variant?.product) {
                restoredProducts.add(sm.variant.product.id);
              }
            }
          }
        }
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          isPaid: newStatus === OrderStatus.DELIVERED ? true : order.isPaid,
          cancelReason: newStatus === OrderStatus.CANCELLED ? (note || "Cancelled by admin") : order.cancelReason,
        },
      });

      let validUserId: string | null = null;
      if (adminUserId) {
        const userExists = await tx.user.findUnique({
          where: { id: adminUserId },
          select: { id: true },
        });
        if (userExists) validUserId = adminUserId;
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: newStatus,
          note: note || (validUserId ? undefined : `Updated by admin`),
          changedByUserId: validUserId,
        },
      });

      return { updated: updatedOrder, restoredProductIds: Array.from(restoredProducts) };
    }, { maxWait: 15000, timeout: 60000 });

    for (const prodId of restoredProductIds) {
      syncMutationToMainSite({
        type: "inventory.updated",
        entityId: prodId,
        entityName: `Stock restored from cancelled order #${orderId}`,
        tags: ["products", "inventory"],
        paths: ["/", "/products"],
        actor: { adminId: adminUserId, email: "" },
      });
    }

    invalidateOrdersCache();
    return updated;
  }

  async addInternalNote(orderId: string, note: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    const currentNotes = order.notes ? `${order.notes}\n---\n${note}` : note;
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { notes: currentNotes },
    });
    invalidateOrdersCache();
    return updated;
  }
}

export const ordersService = new OrdersService();
