import prisma from "@pharmacy-admin/db";
import { redis, isRedisConnected } from "../../lib/redis";

const CACHE_KEY = "admin:dashboard:stats";

let localKpiCache: { data: any; expiresAt: number } | null = null;
const localChartCache = new Map<string, { data: any; expiresAt: number }>();

export class DashboardService {
  async getDashboardKpis() {
    const nowTime = Date.now();
    if (localKpiCache && localKpiCache.expiresAt > nowTime) {
      return localKpiCache.data;
    }

    // Check Redis cache first if connected
    if (isRedisConnected) {
      try {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          localKpiCache = { data: parsed, expiresAt: nowTime + 30000 };
          return parsed;
        }
      } catch (e) {
        console.warn("Redis get error:", e);
      }
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const in1Month = new Date(now);
    in1Month.setMonth(in1Month.getMonth() + 1);

    const [
      revenueAggregate,
      totalOrders,
      newCustomers,
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
      // Refunds sum
      prisma.refund.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo }, status: "PROCESSED" },
        _sum: { amount: true },
      }),
      // Low stock batches (qty <= 10)
      prisma.inventoryBatch.count({
        where: { quantity: { lte: 10 }, isBlocked: false },
      }),
      // Expiring in next 1 month
      prisma.inventoryBatch.count({
        where: {
          expiryDate: { lte: in1Month, gte: now },
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

    localKpiCache = { data, expiresAt: Date.now() + 30000 };
    return data;
  }

  async getSalesChart(days: number = 30) {
    const cacheKey = `sales_chart_${days}`;
    const cached = localChartCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

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

    const result = Object.values(dailyMap);
    localChartCache.set(cacheKey, { data: result, expiresAt: Date.now() + 30000 });
    return result;
  }

  async getOrdersByStatusDonut() {
    const cacheKey = "status_donut";
    const cached = localChartCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const grouped = await prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const result = grouped.map((g) => ({
      status: g.status,
      count: g._count.id,
    }));
    localChartCache.set(cacheKey, { data: result, expiresAt: Date.now() + 30000 });
    return result;
  }

  async getTopSellingProducts(limit = 5) {
    const cacheKey = `top_products_${limit}`;
    const cached = localChartCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const items = await prisma.orderItem.groupBy({
      by: ["productName", "variantId"],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });

    const result = items.map((item) => ({
      name: item.productName,
      unitsSold: item._sum.quantity || 0,
      revenue: Number(item._sum.subtotal || 0),
    }));
    localChartCache.set(cacheKey, { data: result, expiresAt: Date.now() + 30000 });
    return result;
  }

  async getPaymentMethodDistribution() {
    const cacheKey = "payment_distribution";
    const cached = localChartCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const grouped = await prisma.order.groupBy({
      by: ["paymentMethod"],
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    const result = grouped.map((g) => ({
      method: g.paymentMethod,
      amount: Number(g._sum.totalAmount || 0),
      count: g._count.id,
    }));
    localChartCache.set(cacheKey, { data: result, expiresAt: Date.now() + 30000 });
    return result;
  }
}

export const dashboardService = new DashboardService();
