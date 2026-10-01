import prisma from "@pharmacy-admin/db";
import { redis, isRedisConnected } from "../../lib/redis";

const CACHE_KEY = "admin:dashboard:stats";

export class DashboardService {
  async getDashboardKpis() {
    // Check Redis cache first if connected
    if (isRedisConnected) {
      try {
        const cached = await redis.get(CACHE_KEY);
        if (cached) return JSON.parse(cached);
      } catch (e) {
        console.warn("Redis get error:", e);
      }
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      revenueAggregate,
      totalOrders,
      newCustomers,
      pendingPrescriptions,
      refundsSum,
      lowStockCount,
      expiringBatchesCount,
    ] = await Promise.all([
      // Total confirmed/delivered revenue in last 30 days
      prisma.order.aggregate({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { notIn: ["CANCELLED", "RETURNED"] },
          paymentStatus: "PAID",
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      // Total orders
      prisma.order.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      // New customers
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo }, role: "CUSTOMER" },
      }),
      // Pending prescriptions
      prisma.prescription.count({
        where: { status: "PENDING" },
      }),
      // Refunds sum
      prisma.refund.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo }, status: "PROCESSED" },
        _sum: { amount: true },
      }),
      // Low stock batches (qty <= 10)
      prisma.inventoryBatch.count({
        where: { quantity: { lte: 10 }, isBlocked: false },
      }),
      // Expiring in next 30 days
      prisma.inventoryBatch.count({
        where: {
          expiryDate: { lte: in30Days, gte: now },
          quantity: { gt: 0 },
        },
      }),
    ]);

    const revenue = Number(revenueAggregate._sum.totalAmount || 0);
    const paidOrderCount = revenueAggregate._count.id || 0;
    const aov = paidOrderCount > 0 ? Math.round(revenue / paidOrderCount) : 0;

    const data = {
      revenue,
      totalOrders,
      aov,
      newCustomers,
      refundsTotal: Number(refundsSum._sum.amount || 0),
      pendingPrescriptions,
      lowStockCount,
      expiringBatchesCount,
      cachedAt: new Date().toISOString(),
    };

    // Cache in Redis for 5 minutes if connected
    if (isRedisConnected) {
      try {
        await redis.set(CACHE_KEY, JSON.stringify(data), "EX", 300);
      } catch (e) {
        console.warn("Redis set error:", e);
      }
    }

    return data;
  }

  async getSalesChart(days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { notIn: ["CANCELLED"] },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    });

    const dailyMap: Record<string, { date: string; revenue: number; orders: number }> = {};

    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      dailyMap[key] = { date: key, revenue: 0, orders: 0 };
    }

    orders.forEach((o) => {
      const key = o.createdAt.toISOString().split("T")[0];
      if (dailyMap[key]) {
        dailyMap[key].revenue += Number(o.totalAmount);
        dailyMap[key].orders += 1;
      }
    });

    return Object.values(dailyMap);
  }

  async getOrdersByStatusDonut() {
    const grouped = await prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    return grouped.map((g) => ({
      status: g.status,
      count: g._count.id,
    }));
  }

  async getTopSellingProducts(limit = 5) {
    const items = await prisma.orderItem.groupBy({
      by: ["productName", "variantId"],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });

    return items.map((item) => ({
      name: item.productName,
      unitsSold: item._sum.quantity || 0,
      revenue: Number(item._sum.subtotal || 0),
    }));
  }

  async getPaymentMethodDistribution() {
    const grouped = await prisma.order.groupBy({
      by: ["paymentMethod"],
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    return grouped.map((g) => ({
      method: g.paymentMethod,
      amount: Number(g._sum.totalAmount || 0),
      count: g._count.id,
    }));
  }
}

export const dashboardService = new DashboardService();
