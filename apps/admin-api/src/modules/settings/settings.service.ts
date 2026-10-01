import prisma from "@pharmacy-admin/db";
import { redis } from "../../lib/redis";
import { env } from "../../config/env";
import { syncMutationToMainSite } from "../../lib/revalidate";

export class SettingsService {
  async getAllSettings() {
    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });
    return map;
  }

  async updateSettings(values: Record<string, any>, actor: { adminId: string; email: string }) {
    for (const [key, val] of Object.entries(values)) {
      const stringVal = typeof val === "object" ? JSON.stringify(val) : String(val);
      await prisma.setting.upsert({
        where: { key },
        update: { value: stringVal },
        create: { key, value: stringVal },
      });
    }

    // Trigger revalidation across storefront
    syncMutationToMainSite({
      type: "settings.updated",
      entityId: "store-settings",
      tags: ["settings"],
      paths: ["/", "/checkout"],
      actor,
    });

    return this.getAllSettings();
  }

  async checkHealth() {
    let dbStatus = "HEALTHY";
    let redisStatus = "HEALTHY";
    let mainSiteStatus = "HEALTHY";

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "DOWN";
    }

    try {
      await redis.ping();
    } catch {
      redisStatus = "DOWN";
    }

    try {
      const res = await fetch(`${env.MAIN_SITE_URL}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) mainSiteStatus = "DEGRADED";
    } catch {
      mainSiteStatus = "DOWN";
    }

    const lastSyncLogs = await prisma.adminNotificationLog.findMany({
      where: { channel: "REVALIDATION_WEBHOOK" },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return {
      status: dbStatus === "HEALTHY" && redisStatus === "HEALTHY" ? "OPERATIONAL" : "DEGRADED",
      services: {
        database: dbStatus,
        redis: redisStatus,
        mainSiteUrl: env.MAIN_SITE_URL,
        mainSiteStatus,
      },
      lastSyncLogs,
      timestamp: new Date().toISOString(),
    };
  }

  async triggerManualRevalidate(actor: { adminId: string; email: string }) {
    await syncMutationToMainSite({
      type: "settings.updated",
      entityId: "manual-revalidate",
      tags: ["products", "categories", "brands", "banners", "settings"],
      paths: ["/", "/products", "/checkout"],
      actor,
    });
    return { success: true, message: "Manual store revalidation published" };
  }
}

export const settingsService = new SettingsService();
