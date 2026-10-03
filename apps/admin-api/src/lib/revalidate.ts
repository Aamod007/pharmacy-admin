import prisma from "@pharmacy-admin/db";
import { REDIS_CHANNELS, StoreEventType } from "@pharmacy-admin/shared";
import { env } from "../config/env";
import { redis } from "./redis";

interface SyncMutationOptions {
  type: StoreEventType;
  entityId: string;
  entityName?: string;
  tags: string[];
  paths: string[];
  actor: {
    adminId: string;
    email: string;
  };
}

export async function syncMutationToMainSite(options: SyncMutationOptions) {
  const { type, entityId, entityName, tags, paths, actor } = options;

  // 1. Publish to Redis channel store:events
  try {
    const payload = {
      type,
      entityId,
      entityName,
      timestamp: new Date().toISOString(),
      revalidationTags: tags,
      revalidationPaths: paths,
      actor,
    };
    await redis.publish(REDIS_CHANNELS.STORE_EVENTS, JSON.stringify(payload));
  } catch (err: any) {
    console.error("Failed to publish store event to Redis:", err.message);
  }

  // 2. HTTP POST to Main Site ISR /api/revalidate with multi-port localhost fallback
  const targetUrls = Array.from(
    new Set([env.MAIN_SITE_URL, "http://localhost:3001", "http://localhost:3000"])
  );

  let success = false;
  let lastError = "";

  for (const baseUrl of targetUrls) {
    try {
      const response = await fetch(`${baseUrl}/api/revalidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-revalidate-secret": env.REVALIDATE_SECRET,
        },
        body: JSON.stringify({ tags, paths }),
        signal: AbortSignal.timeout(1000),
      });

      if (response.ok) {
        success = true;
        break;
      }
    } catch (err: any) {
      lastError = err.message;
    }
  }

  // 3. Log results to admin_notification_logs
  try {
    await prisma.adminNotificationLog.create({
      data: {
        channel: "REVALIDATION_WEBHOOK",
        recipient: `${env.MAIN_SITE_URL}/api/revalidate`,
        eventType: type,
        payload: { tags, paths, entityId, entityName, actor },
        status: success ? "SUCCESS" : "FAILED",
        errorMessage: success ? null : lastError,
        retryCount: 0,
      },
    });
  } catch (err: any) {
    console.error("Failed to write to admin_notification_logs:", err.message);
  }
}

export async function retryFailedRevalidations(): Promise<{ retried: number; succeeded: number; failed: number }> {
  const failedLogs = await prisma.adminNotificationLog.findMany({
    where: {
      channel: "REVALIDATION_WEBHOOK",
      status: "FAILED",
      retryCount: { lt: 5 },
    },
    take: 25,
    orderBy: { createdAt: "asc" },
  });

  let succeeded = 0;
  let failed = 0;

  for (const log of failedLogs) {
    const payload = log.payload as any;
    const tags = payload?.tags || [];
    const paths = payload?.paths || [];

    const targetUrls = Array.from(
      new Set([env.MAIN_SITE_URL, "http://localhost:3001", "http://localhost:3000"])
    );

    let ok = false;
    let lastError = "";

    for (const baseUrl of targetUrls) {
      try {
        const response = await fetch(`${baseUrl}/api/revalidate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-revalidate-secret": env.REVALIDATE_SECRET,
          },
          body: JSON.stringify({ tags, paths }),
          signal: AbortSignal.timeout(1000),
        });

        if (response.ok) {
          ok = true;
          break;
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    if (ok) {
      succeeded++;
      await prisma.adminNotificationLog.update({
        where: { id: log.id },
        data: {
          status: "SUCCESS",
          retryCount: log.retryCount + 1,
          errorMessage: null,
        },
      });
    } else {
      failed++;
      await prisma.adminNotificationLog.update({
        where: { id: log.id },
        data: {
          retryCount: log.retryCount + 1,
          errorMessage: lastError || "Retry attempt failed",
        },
      });
    }
  }

  return { retried: failedLogs.length, succeeded, failed };
}

